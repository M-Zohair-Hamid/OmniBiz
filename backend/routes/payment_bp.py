from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Payment, Order
from utils import get_company_id_from_token, format_date_display
from datetime import datetime
from sqlalchemy import func

bp = Blueprint('payments', __name__, url_prefix='/api/payments')

def get_session():
    """Get the session bound to current company's database"""
    from flask import g
    company_code = getattr(g, 'company_code', 'umarsons')
    # Use db.get_engine with the correct bind
    engine = db.get_engine(bind=company_code)
    # Create a new session with this engine
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    return Session()

def verify_company_access():
    return get_company_id_from_token()

@bp.route('', methods=['GET'])
def get_payments():
    """Get all payments for the company"""
    try:
        session = get_session()
        company_code = getattr(g, 'company_code', 'unknown')
        print(f"[GET_PAYMENTS] Fetching payments for company: {company_code}")
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # No need to filter by company_id - the database is already company-specific
        query = session.query(Payment)
        
        # Get total count
        total = query.count()
        print(f"[GET_PAYMENTS] Total payments: {total}")
        
        # Apply pagination
        offset = (page - 1) * per_page
        payments = query.order_by(Payment.created_at.desc()).offset(offset).limit(per_page).all()

        order_ids = {p.order_id for p in payments if p.order_id}
        order_totals = {}
        if order_ids:
            totals = (
                session.query(Payment.order_id, func.coalesce(func.sum(Payment.amount), 0))
                .filter(Payment.order_id.in_(order_ids))
                .group_by(Payment.order_id)
                .all()
            )
            order_totals = {order_id: round(total_paid, 2) for order_id, total_paid in totals}

        status_updated = False
        data = []

        for p in payments:
            total_paid = order_totals.get(p.order_id, 0)
            order_total = round(p.order.total_amount, 2) if p.order else 0
            remaining = round((order_total - total_paid) if p.order else 0, 2)

            if p.order:
                if total_paid <= 0:
                    computed_status = 'pending'
                elif remaining <= 0:
                    computed_status = 'paid'
                else:
                    computed_status = 'partial'

                if p.order.status != computed_status:
                    p.order.status = computed_status
                    status_updated = True

        data.append({
            'id': p.id,
            'order_id': p.order_id,
            'order_number': p.order.order_number if p.order else 'N/A',
            'buyer_name': p.order.buyer.company_name if p.order and p.order.buyer else 'N/A',
            'payment_date': format_date_display(p.payment_date),
            'amount': round(p.amount, 2),
            'balance': round(p.balance, 2),
            'payment_method': p.payment_method,
            'payment_type': p.payment_type,
            'notes': p.notes,
            'income_tax_rate': round(p.income_tax_rate, 2) if p.income_tax_rate else 0,
            'income_tax_amount': round(p.income_tax_amount, 2) if p.income_tax_amount else 0,
            'order_total': order_total,
            'order_remaining': remaining,
            'order_status': p.order.status if p.order else 'N/A',
            'created_at': format_date_display(p.created_at)
        })

        if status_updated:
            session.commit()

        # Calculate total pages
        pages = (total + per_page - 1) // per_page
        print(f"[GET_PAYMENTS] Returning {len(data)} payments")

        return jsonify({
            'data': data,
            'total': total,
            'pages': pages,
            'current_page': page
        }), 200
    except Exception as e:
        print(f"[GET_PAYMENTS] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:payment_id>', methods=['GET'])
def get_payment(payment_id):
    """Get specific payment details"""
    session = get_session()
    company_id = verify_company_access()
    
    payment = session.query(Payment).filter_by(id=payment_id, company_id=company_id).first()
    
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    return jsonify({
        'id': payment.id,
        'order_id': payment.order_id,
        'order_number': payment.order.order_number if payment.order else 'N/A',
        'buyer_name': payment.order.buyer.company_name if payment.order and payment.order.buyer else 'N/A',
        'payment_date': payment.payment_date.isoformat(),
        'amount': round(payment.amount, 2),
        'balance': round(payment.balance, 2),
        'payment_method': payment.payment_method,
        'payment_type': payment.payment_type,
        'notes': payment.notes,
        'income_tax_rate': round(payment.income_tax_rate, 2) if payment.income_tax_rate else 0,
        'income_tax_amount': round(payment.income_tax_amount, 2) if payment.income_tax_amount else 0,
        'order_total': payment.order.total_amount if payment.order else 0,
        'created_at': format_date_display(payment.created_at)
    }), 200

@bp.route('', methods=['POST'])
def create_payment():
    """Create a new payment"""
    session = get_session()
    company_id = verify_company_access()
    data = request.get_json()
    
    if not data.get('order_id') or not data.get('amount') or not data.get('payment_method'):
        return jsonify({'error': 'Missing required fields: order_id, amount, payment_method'}), 400
    
    # Verify order exists and belongs to company
    order = session.query(Order).filter_by(id=data['order_id'], company_id=company_id).first()
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Validate and round payment amount
    amount = float(data['amount'])
    amount = round(amount, 2)  # Round to 2 decimal places
    
    if amount <= 0:
        return jsonify({'error': 'Payment amount must be greater than 0'}), 400
    
    # Calculate total payments for this order
    existing_payments = session.query(Payment).filter_by(order_id=data['order_id']).all()
    total_paid = round(sum(p.amount for p in existing_payments), 2)
    
    # Round order total
    order_total = round(order.total_amount, 2)
    
    if total_paid + amount > order_total:
        return jsonify({'error': f'Payment amount exceeds order balance. Order total: {order_total}, Already paid: {total_paid}, Remaining: {order_total - total_paid}'}), 400
    
    try:
        # Calculate remaining balance after this payment
        remaining_balance = round(order_total - (total_paid + amount), 2)
        
        # Get income tax rate and calculate amount
        income_tax_rate = float(data.get('income_tax_rate', 0))
        income_tax_rate = round(income_tax_rate, 2)
        income_tax_amount = round((amount * income_tax_rate / 100), 2)

        # Auto-upgrade to "full" if payment covers entire remaining balance
        payment_type = data.get('payment_type', 'partial')
        if remaining_balance <= 0:
            payment_type = 'full'  # Auto-upgrade to full payment

        payment = Payment(
            order_id=data['order_id'],
            company_id=company_id,
            payment_date=datetime.fromisoformat(data['payment_date']) if data.get('payment_date') else datetime.utcnow(),
            amount=amount,
            balance=remaining_balance,
            payment_method=data['payment_method'],
            payment_type=payment_type,
            notes=data.get('notes', ''),
            income_tax_rate=income_tax_rate,
            income_tax_amount=income_tax_amount
        )

        session.add(payment)

        total_paid_after = round(total_paid + amount, 2)
        if remaining_balance <= 0:
            order.status = 'paid'
        else:
            order.status = 'partial'

        session.commit()
        
        return jsonify({
            'id': payment.id,
            'message': 'Payment recorded successfully',
            'total_paid': total_paid_after,
            'remaining': remaining_balance,
            'payment_type': payment_type,
            'auto_upgraded': payment_type == 'full' and data.get('payment_type') == 'partial'
        }), 201
    except Exception as e:
        session.rollback()
        print(f"Error creating payment: {str(e)}")
        return jsonify({'error': f'Failed to create payment: {str(e)}'}), 500

@bp.route('/<int:payment_id>', methods=['DELETE'])
def delete_payment(payment_id):
    """Delete a payment"""
    session = get_session()
    company_id = verify_company_access()
    
    payment = session.query(Payment).filter_by(id=payment_id, company_id=company_id).first()
    
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    try:
        order = payment.order
        session.delete(payment)
        session.flush()

        updated_order = None
        if order:
            remaining_payments = session.query(Payment).filter_by(order_id=order.id).all()
            total_paid = round(sum(p.amount for p in remaining_payments), 2)
            remaining = round(order.total_amount - total_paid, 2)
            if total_paid <= 0:
                order.status = 'pending'
            elif remaining <= 0:
                order.status = 'paid'
            else:
                order.status = 'partial'
            
            updated_order = {
                'id': order.id,
                'order_number': order.order_number,
                'status': order.status,
                'total_amount': order.total_amount
            }

        session.commit()
        return jsonify({
            'message': 'Payment deleted successfully',
            'order': updated_order
        }), 200
    except Exception as e:
        session.rollback()
        print(f"Error deleting payment: {str(e)}")
        return jsonify({'error': f'Failed to delete payment: {str(e)}'}), 500

@bp.route('/order/<int:order_id>', methods=['GET'])
def get_order_payments(order_id):
    """Get all payments for a specific order"""
    session = get_session()
    company_id = verify_company_access()
    
    # Verify order exists
    order = session.query(Order).filter_by(id=order_id, company_id=company_id).first()
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    payments = session.query(Payment).filter_by(order_id=order_id).order_by(Payment.payment_date.desc()).all()
    
    total_paid = round(sum(p.amount for p in payments), 2)
    remaining = round(order.total_amount - total_paid, 2)

    if total_paid <= 0:
        order.status = 'pending'
    elif remaining <= 0:
        order.status = 'paid'
    else:
        order.status = 'partial'

    session.commit()
    
    return jsonify({
        'order_id': order_id,
        'order_number': order.order_number,
        'order_total': order.total_amount,
        'total_paid': total_paid,
        'remaining': remaining,
        'order_status': order.status,
        'payments': [{
            'id': p.id,
            'payment_date': format_date_display(p.payment_date),
            'amount': p.amount,
            'payment_method': p.payment_method,
            'payment_type': p.payment_type,
            'notes': p.notes,
            'income_tax_rate': round(p.income_tax_rate, 2) if p.income_tax_rate else 0,
            'income_tax_amount': round(p.income_tax_amount, 2) if p.income_tax_amount else 0
        } for p in payments]
    }), 200
