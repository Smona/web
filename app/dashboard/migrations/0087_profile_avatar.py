# Generated by Django 2.0.6 on 2018-06-15 14:36

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('avatar', '0001_initial'),
        ('dashboard', '0086_auto_20180613_1328'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='avatar',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='avatar.Avatar'),
        ),
    ]
