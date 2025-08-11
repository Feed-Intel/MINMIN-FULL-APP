from django.db import migrations

def generate_table_codes(apps, schema_editor):
    Table = apps.get_model('table', 'Table')
    for branch in Table.objects.values_list('branch_id', flat=True).distinct():
        tables = Table.objects.filter(branch_id=branch).order_by('id')
        for index, table in enumerate(tables, start=1):
            branch_code = table.branch.address[:3].upper()
            table.table_code = f"{branch_code}-{index:03d}"
            table.save()

class Migration(migrations.Migration):

    dependencies = [
        ('table', '0002_table_table_code'),
    ]

    operations = [
        migrations.RunPython(generate_table_codes),
    ]