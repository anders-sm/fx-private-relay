# Generated by Django 2.2.2 on 2019-06-06 02:49

from django.db import migrations, models
import django.db.models.deletion
import emails.models


class Migration(migrations.Migration):

    dependencies = [
        ("emails", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Message",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("from_address", models.CharField(max_length=255)),
                ("subject", models.CharField(max_length=255)),
                ("message", models.TextField()),
            ],
        ),
        migrations.AlterField(
            model_name="relayaddress",
            name="address",
            field=models.CharField(
                default=emails.models.address_default, max_length=64, unique=True
            ),
        ),
        migrations.DeleteModel(
            name="Messages",
        ),
        migrations.AddField(
            model_name="message",
            name="relay_address",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="emails.RelayAddress"
            ),
        ),
    ]
