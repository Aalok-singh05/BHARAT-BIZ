import ast
import sys

files = [
    "app/main.py",
    "app/router/invoice_router.py",
    "app/integrations/whatsapp.py",
    "app/scheduler/reminders.py",
    "app/scheduler/alerts.py",
    "app/router/customer_router.py",
    "app/router/analytics_router.py",
    "app/router/order_history_router.py",
    "app/crud/inventory.py",
    "app/crud/order.py",
    "app/utils/pdf.py",
    "app/models/__init__.py",
]

errors = []
for f in files:
    try:
        with open(f, "r") as fh:
            ast.parse(fh.read())
        print(f"  OK: {f}")
    except SyntaxError as e:
        print(f"  FAIL: {f} -> {e}")
        errors.append(f)

if errors:
    print(f"\n{len(errors)} file(s) have syntax errors!")
    sys.exit(1)
else:
    print(f"\nAll {len(files)} files parse OK!")
