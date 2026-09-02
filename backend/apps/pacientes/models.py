from django.db import models


class Paciente(models.Model):
    class Sexo(models.TextChoices):
        MASCULINO = "M", "Masculino"
        FEMENINO = "F", "Femenino"
        OTRO = "O", "Otro"
        NO_REGISTRADO = "NR", "No registrado"

    class TipoTrastorno(models.TextChoices):
        HEMOFILIA_A = "HEMO_A", "Hemofilia A"
        HEMOFILIA_B = "HEMO_B", "Hemofilia B"
        VON_WILLEBRAND = "VWD", "Enfermedad de Von Willebrand"
        OTRO = "OTRO", "Otro trastorno hemorrágico"
        PENDIENTE = "PEND", "Pendiente de clasificación"

    class Gravedad(models.TextChoices):
        LEVE = "LEVE", "Leve"
        MODERADA = "MOD", "Moderada"
        SEVERA = "SEV", "Severa"
        NO_APLICA = "NA", "No aplica"
        NO_DETERMINADA = "ND", "No determinada"

    class Estado(models.TextChoices):
        ACTIVO = "ACTIVO", "Activo"
        INACTIVO = "INACTIVO", "Inactivo"

    tipo_documento = models.CharField(
        max_length=20,
        verbose_name="Tipo de documento",
    )

    numero_documento = models.CharField(
        max_length=30,
        unique=True,
        verbose_name="Número de documento",
    )

    nombres = models.CharField(
        max_length=100,
        verbose_name="Nombres",
    )

    apellidos = models.CharField(
        max_length=100,
        verbose_name="Apellidos",
    )

    fecha_nacimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name="Fecha de nacimiento",
    )

    sexo = models.CharField(
        max_length=2,
        choices=Sexo.choices,
        default=Sexo.NO_REGISTRADO,
        verbose_name="Sexo",
    )

    telefono = models.CharField(
        max_length=30,
        blank=True,
        verbose_name="Teléfono",
    )

    correo_electronico = models.EmailField(
        blank=True,
        verbose_name="Correo electrónico",
    )

    departamento = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Departamento",
    )

    municipio = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Municipio",
    )

    tipo_trastorno = models.CharField(
        max_length=20,
        choices=TipoTrastorno.choices,
        default=TipoTrastorno.PENDIENTE,
        verbose_name="Tipo de trastorno hemorrágico",
    )

    gravedad = models.CharField(
        max_length=5,
        choices=Gravedad.choices,
        default=Gravedad.NO_DETERMINADA,
        verbose_name="Gravedad",
    )

    estado = models.CharField(
        max_length=10,
        choices=Estado.choices,
        default=Estado.ACTIVO,
        verbose_name="Estado",
    )

    fecha_registro = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de registro",
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name="Fecha de actualización",
    )

    class Meta:
        ordering = ["apellidos", "nombres"]
        verbose_name = "Paciente"
        verbose_name_plural = "Pacientes"

    def __str__(self):
        return f"{self.nombres} {self.apellidos} - {self.numero_documento}"
