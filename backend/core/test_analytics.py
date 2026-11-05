from datetime import timedelta
from io import StringIO
from pathlib import Path
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.core.management import call_command, CommandError
from django.test import TestCase
from django.utils import timezone
from .models import Zone, Report, ReportUpdate, MeterReading


class AnalyticsTests(TestCase):
    def setUp(self):
        self.zone = Zone.objects.create(id='cse', name='CSE')
        self.user = get_user_model().objects.create_user('tester')

    def test_report_visibility_full_set_and_resolution_event_dates(self):
        def record(status):
            return Report(user=self.user,zone=self.zone,status=status,category='Water')
        Report.objects.bulk_create([record('Verified') for _ in range(205)])
        hidden = record('Pending')
        hidden.save()
        old = record('Resolved')
        old.save()
        Report.objects.filter(pk=old.pk).update(created_at=timezone.now()-timedelta(days=60))
        ReportUpdate.objects.create(report=old,status='Resolved')
        url='/api/analytics/buildings/?zone=cse&days=30&category=Water'
        data=self.client.get(url).json()
        self.assertEqual(data['counts']['cse'],205)
        self.assertEqual(sum(w['opened'] for w in data['weeks']),205)
        self.assertEqual(sum(w['resolved'] for w in data['weeks']),1)
        last_page=self.client.get(url+'&page=11').json()
        self.assertEqual(len(last_page['recent']),5)
        self.client.force_login(self.user)
        self.assertEqual(self.client.get(url).json()['counts']['cse'],206)
        self.assertEqual(self.client.get(url.replace('Water','Waste')).json()['counts'],{})
        self.assertEqual(self.client.get(url.replace('30','all')).json()['total'],207)

    def test_meter_import_idempotency_gaps_zero_resets_and_rollback(self):
        header='zone,meter,timestamp,unit,kind,value,source\n'
        def row(day,value,kind='cumulative'):
            return f'cse,M1,2025-01-{day:02}T00:00:00+05:30,kWh,{kind},{value},Fixture\n'
        with TemporaryDirectory() as tmp:
            file=Path(tmp)/'input.csv'
            def load():
                call_command('import_electricity',str(file),stdout=StringIO())
            file.write_text(header+row(1,100)+row(2,110)+row(3,110)+row(5,130)+row(6,7)+row(7,2,'daily'))
            load()
            load()
            self.assertEqual(MeterReading.objects.count(),6)
            data=self.client.get('/api/analytics/electricity/').json()
            usage={d['date']:d['kwh'] for d in data['days']}
            self.assertEqual(usage['2025-01-01'],10)
            self.assertEqual(usage['2025-01-02'],0)
            self.assertIsNone(usage['2025-01-04'])
            self.assertIsNone(usage['2025-01-05'])
            self.assertEqual(usage['2025-01-06'],2)
            self.assertEqual(sum(w['covered'] for w in data['weeks']),3)
            file.write_text(header+row(8,9)+row(1,45))
            with self.assertRaises(CommandError):load()
            self.assertEqual(MeterReading.objects.count(),6)
