"""
Utility functions for backend operations
"""
from flask import request, g

def get_company_id_from_token():
    """Extract company_id from request headers
    
    NOTE: With separate databases, this now returns the company_id from the 
    X-Company-Id header. Each company has its own database, so company_id 
    will always be 1 for UmarSons and 2 for Makkah Packages.
    """
    # Prefer mock token in Authorization header (dev mode)
    auth_header = request.headers.get('Authorization', '')
    if 'mock-token-MP' in auth_header or 'mock-token-QP' in auth_header:
        return 2
    if 'mock-token-PC' in auth_header:
        return 1

    # Prefer company code header (more reliable with per-company DBs)
    company_code = request.headers.get('X-Company-Code', '')
    company_code = (company_code or '').upper()
    if company_code in ['PC', 'UMARSONS']:
        return 1  # UmarSons
    elif company_code in ['QP', 'MP', 'MAKKAH_PACKAGES', 'MAKKAH']:
        return 2  # Makkah Packages

    # Fallback: use current company code from context
    current_code = getattr(g, 'company_code', '').lower()
    if current_code == 'makkah_packages':
        return 2
    if current_code == 'umarsons':
        return 1

    # Final fallback: use X-Company-Id header if present
    company_id = request.headers.get('X-Company-Id')
    if company_id:
        return int(company_id)
    
    # Default to company 1 (UmarSons)
    return 1

def get_current_company_code():
    """Get the current company code from request context"""
    return getattr(g, 'company_code', 'umarsons')

def number_to_words(amount):
    """Convert a number to words (Pakistani Rupees format)"""
    if amount == 0:
        return "Zero Rupees Only"
    
    # Handle decimal part (paisa)
    rupees = int(amount)
    paisa = int(round((amount - rupees) * 100))
    
    # Number names
    ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 
             'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    
    def convert_below_thousand(n):
        if n == 0:
            return ''
        elif n < 10:
            return ones[n]
        elif n < 20:
            return teens[n - 10]
        elif n < 100:
            return tens[n // 10] + (' ' + ones[n % 10] if n % 10 != 0 else '')
        else:
            return ones[n // 100] + ' Hundred' + (' ' + convert_below_thousand(n % 100) if n % 100 != 0 else '')
    
    def convert_to_words(num):
        if num == 0:
            return ''
        
        # Pakistani numbering system: Crore, Lakh, Thousand
        crore = num // 10000000
        num %= 10000000
        lakh = num // 100000
        num %= 100000
        thousand = num // 1000
        num %= 1000
        
        result = []
        
        if crore > 0:
            result.append(convert_below_thousand(crore) + ' Crore')
        if lakh > 0:
            result.append(convert_below_thousand(lakh) + ' Lakh')
        if thousand > 0:
            result.append(convert_below_thousand(thousand) + ' Thousand')
        if num > 0:
            result.append(convert_below_thousand(num))
        
        return ' '.join(result)
    
    words = convert_to_words(rupees)
    
    if paisa > 0:
        return f"{words} Rupees and {convert_below_thousand(paisa)} Paisa Only"
    else:
        return f"{words} Rupees Only"

def format_date_display(date_obj):
    """Format date object as dd-mm-yyyy string for display"""
    if not date_obj:
        return None
    try:
        from datetime import datetime
        if isinstance(date_obj, str):
            date_obj = datetime.fromisoformat(date_obj)
        return date_obj.strftime('%d-%m-%Y')
    except (TypeError, ValueError):
        return str(date_obj)
