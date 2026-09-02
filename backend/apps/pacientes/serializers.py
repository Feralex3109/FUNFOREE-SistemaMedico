from rest_framework import serializers

from .models import Paciente


class PacienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields = "__all__"
        read_only_fields = [
            "fecha_registro",
            "fecha_actualizacion",
        ]