from .models import RegistroAuditoria


def registrar_auditoria(
    *,
    usuario,
    accion,
    modulo,
    objeto_id="",
    descripcion="",
    direccion_ip=None,
    datos_anteriores=None,
    datos_nuevos=None,
):
    """
    Crea un registro de auditoría para una operación realizada
    dentro del sistema FUNFOREE-SADHIA.
    """

    return RegistroAuditoria.objects.create(
        usuario=usuario,
        accion=accion,
        modulo=modulo,
        objeto_id=str(objeto_id) if objeto_id else "",
        descripcion=descripcion,
        direccion_ip=direccion_ip,
        datos_anteriores=datos_anteriores,
        datos_nuevos=datos_nuevos,
    )