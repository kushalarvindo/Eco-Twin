import csv
from datetime import datetime, time
from decimal import Decimal, InvalidOperation
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from core.models import MeterReading, Zone


class Command(BaseCommand):
    help = 'Import authorised daily electricity readings (kWh, campus local time).'

    def add_arguments(self, parser):
        parser.add_argument('csv_path')

    @transaction.atomic
    def handle(self, csv_path, **options):
        fields = {'zone','meter','timestamp','unit','kind','value','source'}
        created = 0
        try:
            with open(csv_path, newline='', encoding='utf-8-sig') as file:
                rows = csv.DictReader(file)
                if set(rows.fieldnames or []) != fields:
                    raise CommandError('Required columns: zone,meter,timestamp,unit,kind,value,source')
                for line, row in enumerate(rows, 2):
                    row = {key: value.strip() for key,value in row.items() if isinstance(value,str)}
                    stamp = datetime.fromisoformat(row['timestamp'])
                    if stamp.tzinfo is None:
                        raise ValueError('timestamp requires a UTC offset')
                    local = timezone.localtime(stamp)
                    value = Decimal(row['value'])
                    if (local.time() != time.min or local.date() > timezone.localdate()
                        or row['unit'] != 'kWh' or row['kind'] not in ('daily','cumulative')
                        or not value.is_finite() or value < 0 or value >= 10**11 or value != value.quantize(Decimal('.001'))
                        or not 0 < len(row['meter']) <= 80 or not 0 < len(row['source']) <= 160
                        or not Zone.objects.filter(pk=row['zone']).exists()):
                        raise ValueError('invalid building, meter, source, date, unit, kind or reading')
                    values = dict(reading=value,cumulative=row['kind']=='cumulative',source=row['source'])
                    item, new = MeterReading.objects.get_or_create(zone_id=row['zone'], meter=row['meter'],date=local.date(), defaults=values)
                    if any(getattr(item,k)!=v for k,v in values.items()):
                        raise ValueError('conflicting record for the same building, meter and day')
                    created += int(new)
        except (OSError, UnicodeError, KeyError, ValueError, InvalidOperation, csv.Error) as exc:
            raise CommandError(f"Import failed at row {locals().get('line', 1)}: {exc}") from exc
        self.stdout.write(f'{created} new readings.')
