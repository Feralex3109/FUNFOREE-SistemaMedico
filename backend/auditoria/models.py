from django.conf import settings
from django.db import models


class RegistroAuditoria(models.Model):
    class Accion(models.TextChoices):
        CREAR = "CREAR", "Crear"
        CONSULTAR = "CONSULTAR", "Consultar"
        MODIFICAR = "MODIFICAR", "Modificar"
        ELIMINAR = "ELIMINAR", "Eliminar"

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="registros_auditoria",
        verbose_name="Usuario",
    )

    accion = models.CharField(
        max_length=20,
        choices=Accion.choices,
        verbose_name="Acción",
    )

    modulo = models.CharField(
        max_length=100,
        verbose_name="Módulo",
    )

    objeto_id = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Identificador del objeto",
    )

    descripcion = models.TextField(
        blank=True,
        verbose_name="Descripción",
    )

    direccion_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name="Dirección IP",
    )

    datos_anteriores = models.JSONField(
        null=True,
        blank=True,
        verbose_name="Datos anteriores",
    )

    datos_nuevos = models.JSONField(
        null=True,
        blank=True,
        verbose_name="Datos nuevos",
    )

    fecha_hora = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha y hora",
    )

    class Meta:
        ordering = ["-fecha_hora"]
        verbose_name = "Registro de auditoría"
        verbose_name_plural = "Registros de auditoría"

        permissions = [
        (
            "consultar_auditoria",
            "Puede consultar los registros de auditoría",
        ),
    ]

    def __str__(self):
        usuario = self.usuario.username if self.usuario else "Sistema"
        return f"{self.fecha_hora} - {usuario} - {self.accion} - {self.modulo}"
