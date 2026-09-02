from django.contrib import admin

from .models import Paciente


@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    """
    Administración de pacientes en FUNFOREE-SADHIA.
    """

    list_display = (
        "id",
        "numero_documento",
        "nombres",
        "apellidos",
        "tipo_trastorno",
        "gravedad",
        "estado",
        "fecha_registro",
    )

    list_filter = (
        "tipo_trastorno",
        "gravedad",
        "estado",
        "sexo",
        "departamento",
    )

    search_fields = (
        "numero_documento",
        "nombres",
        "apellidos",
        "correo_electronico",
    )

    ordering = (
        "apellidos",
        "nombres",
    )

    readonly_fields = (
        "fecha_registro",
        "fecha_actualizacion",
    )

    fieldsets = (
        (
            "Identificación",
            {
                "fields": (
                    "tipo_documento",
                    "numero_documento",
                    "nombres",
                    "apellidos",
                    "fecha_nacimiento",
                    "sexo",
                )
            },
        ),
        (
            "Información de contacto",
            {
                "fields": (
                    "telefono",
                    "correo_electronico",
                    "departamento",
                    "municipio",
                )
            },
        ),
        (
            "Información clínica",
            {
                "fields": (
                    "tipo_trastorno",
                    "gravedad",
                    "estado",
                )
            },
        ),
        (
            "Control del registro",
            {
                "fields": (
                    "fecha_registro",
                    "fecha_actualizacion",
                )
            },
        ),
    )
