from rest_framework import permissions, viewsets

from auditoria.services import registrar_auditoria

from .models import Paciente
from .serializers import PacienteSerializer


class PacienteViewSet(viewsets.ModelViewSet):
    """
    API para gestionar los pacientes registrados
    en el sistema FUNFOREE-SADHIA.
    """

    queryset = Paciente.objects.all()
    serializer_class = PacienteSerializer
    permission_classes = [permissions.DjangoModelPermissions]

    def obtener_ip(self, request):
        """
        Obtiene la dirección IP del cliente.
        """
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR")

        if forwarded:
            return forwarded.split(",")[0].strip()

        return request.META.get("REMOTE_ADDR")

    def retrieve(self, request, *args, **kwargs):
        """
        Consulta el detalle de un paciente y registra
        la consulta en la auditoría.
        """
        response = super().retrieve(request, *args, **kwargs)

        paciente = self.get_object()

        registrar_auditoria(
            usuario=request.user,
            accion="CONSULTAR",
            modulo="Pacientes",
            objeto_id=paciente.id,
            descripcion=f"Consulta del paciente {paciente.id}",
            direccion_ip=self.obtener_ip(request),
        )

        return response

    def perform_create(self, serializer):
        """
        Registra la creación de un paciente.
        """
        paciente = serializer.save()

        registrar_auditoria(
            usuario=self.request.user,
            accion="CREAR",
            modulo="Pacientes",
            objeto_id=paciente.id,
            descripcion=f"Creación del paciente {paciente.id}",
            direccion_ip=self.obtener_ip(self.request),
            datos_nuevos=PacienteSerializer(paciente).data,
        )

    def perform_update(self, serializer):
        """
        Registra la modificación de un paciente.
        """
        paciente = self.get_object()
        datos_anteriores = PacienteSerializer(paciente).data

        paciente = serializer.save()

        registrar_auditoria(
            usuario=self.request.user,
            accion="MODIFICAR",
            modulo="Pacientes",
            objeto_id=paciente.id,
            descripcion=f"Modificación del paciente {paciente.id}",
            direccion_ip=self.obtener_ip(self.request),
            datos_anteriores=datos_anteriores,
            datos_nuevos=PacienteSerializer(paciente).data,
        )

    def perform_destroy(self, instance):
        """
        Registra la eliminación de un paciente.
        """
        datos_anteriores = PacienteSerializer(instance).data
        paciente_id = instance.id

        registrar_auditoria(
            usuario=self.request.user,
            accion="ELIMINAR",
            modulo="Pacientes",
            objeto_id=paciente_id,
            descripcion=f"Eliminación del paciente {paciente_id}",
            direccion_ip=self.obtener_ip(self.request),
            datos_anteriores=datos_anteriores,
        )

        instance.delete()