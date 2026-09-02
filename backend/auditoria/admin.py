from django.contrib import admin

from .models import RegistroAuditoria


@admin.register(RegistroAuditoria)
class RegistroAuditoriaAdmin(admin.ModelAdmin):
    """
    Administración de registros de auditoría.
    Los registros son de solo lectura y su consulta
    está restringida al permiso personalizado
    consultar_auditoria.
    """

    list_display = (
        "fecha_hora",
        "usuario",
        "accion",
        "modulo",
        "objeto_id",
        "direccion_ip",
    )

    list_filter = (
        "accion",
        "modulo",
        "fecha_hora",
    )

    search_fields = (
        "usuario__username",
        "modulo",
        "objeto_id",
        "descripcion",
        "direccion_ip",
    )

    readonly_fields = (
        "usuario",
        "accion",
        "modulo",
        "objeto_id",
        "descripcion",
        "direccion_ip",
        "datos_anteriores",
        "datos_nuevos",
        "fecha_hora",
    )

    ordering = ("-fecha_hora",)

    def has_module_permission(self, request):
        """
        Permite visualizar el módulo de auditoría únicamente
        a usuarios que tengan el permiso personalizado.
        """
        return request.user.has_perm(
            "auditoria.consultar_auditoria"
        )

    def has_view_permission(self, request, obj=None):
        """
        Permite consultar registros de auditoría únicamente
        a usuarios autorizados.
        """
        return request.user.has_perm(
            "auditoria.consultar_auditoria"
        )

    def has_add_permission(self, request):
        """
        Impide crear registros manualmente desde el Admin.
        """
        return False

    def has_change_permission(self, request, obj=None):
        """
        Impide modificar registros de auditoría.
        """
        return False

    def has_delete_permission(self, request, obj=None):
        """
        Impide eliminar registros de auditoría desde el Admin.
        """
        return False
