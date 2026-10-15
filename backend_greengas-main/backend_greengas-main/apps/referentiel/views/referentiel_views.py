<<<<<<< Updated upstream
from math import asin, cos, radians, sin, sqrt

from rest_framework import generics, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from apps.referentiel.models import Site, Secteur, Bac
=======
import math
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.referentiel.models import Site, Secteur, Bac, StatutBac
>>>>>>> Stashed changes
from apps.referentiel.serializers import SiteSerializer, SecteurSerializer, BacSerializer
from apps.comptes.permissions import EstAdmin, EstAdminOuResponsable


class BacsProchesView(APIView):
    """GET /api/v1/bacs/proches/ — bacs actifs, sans données sensibles."""
    permission_classes = []

    def get(self, request):
        try:
            latitude = float(request.query_params['latitude'])
            longitude = float(request.query_params['longitude'])
            if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
                raise ValueError
        except (KeyError, TypeError, ValueError):
            raise serializers.ValidationError({
                'latitude': 'Latitude et longitude valides sont requises.'
            })

        def distance(bac):
            lat1, lat2 = radians(latitude), radians(float(bac.latitude))
            dlat = lat2 - lat1
            dlon = radians(float(bac.longitude) - longitude)
            h = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
            return 6_371_000 * 2 * asin(sqrt(h))

        bacs = sorted(Bac.objects.filter(statut='actif'), key=distance)[:8]
        return Response([
            {
                'code': bac.code,
                'residence': bac.residence,
                'latitude': bac.latitude,
                'longitude': bac.longitude,
                'distance_m': round(distance(bac), 1),
            }
            for bac in bacs
        ])


class SiteListView(generics.ListAPIView):
    """GET /api/v1/sites/ — Liste des sites méthaniseurs (non paginée)"""
    queryset = Site.objects.all().order_by('code')
    serializer_class = SiteSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class SiteDetailUpdateView(generics.RetrieveUpdateAPIView):
    """
    GET /api/v1/sites/{id}/
    PATCH /api/v1/sites/{id}/ — Changer le statut (nominal/alerte/maintenance)
    """
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT']:
            return [EstAdminOuResponsable()]
        return [IsAuthenticated()]

    def perform_update(self, serializer):
        ancien_statut = self.get_object().statut
        site = serializer.save()
        nouveau_statut = site.statut

        if ancien_statut != nouveau_statut:
            try:
                from apps.comptes.models import Role, Utilisateur
                from apps.supervision.models import TypeNotification, NiveauNotification
                from apps.supervision.services import notifier_utilisateurs
                dest = Utilisateur.objects.filter(role__in=[Role.RESPONSABLE_METHANISATION, Role.ADMINISTRATEUR], actif=True)
                secteur = site.secteurs.first()
                repli = secteur.site_repli if secteur else None
                if nouveau_statut == 'maintenance':
                    if secteur and repli:
                        msg = f"{site.code} en maintenance : les tournées {secteur.code} partent vers {repli.code}."
                    else:
                        msg = f"{site.code} est passé en maintenance."
                else:
                    msg = f"{site.code} remis en service ({nouveau_statut})."

                notifier_utilisateurs(
                    destinataires=dest,
                    type=TypeNotification.SITE_MAINTENANCE,
                    niveau=NiveauNotification.ATTENTION,
                    titre="Maintenance site",
                    message=msg,
                    objet_type="site",
                    objet_id=site.id,
                    auteur=self.request.user
                )
            except Exception:
                pass


class SecteurListView(generics.ListAPIView):
    """GET /api/v1/secteurs/ — Liste des secteurs (non paginée)"""
    queryset = Secteur.objects.all().order_by('code')
    serializer_class = SecteurSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None



class SecteurDetailUpdateView(generics.RetrieveUpdateAPIView):
    """
    GET /api/v1/secteurs/{id}/
    PATCH /api/v1/secteurs/{id}/ — Modifier les sites rattachés (Admin)
    """
    queryset = Secteur.objects.all()
    serializer_class = SecteurSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT']:
            return [EstAdmin()]
        return [IsAuthenticated()]


class BacListCreateView(generics.ListCreateAPIView):
    """
    GET /api/v1/bacs/ — Liste des bacs (filtrable par secteur et statut)
    POST /api/v1/bacs/ — Création d'un bac (Admin)
    """
    serializer_class = BacSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Bac.objects.all().order_by('code')
        secteur = self.request.query_params.get('secteur')
        if secteur:
            queryset = queryset.filter(secteur__code=secteur)
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        return queryset

    def get_permissions(self):
        if self.request.method == 'POST':
            return [EstAdmin()]
        return [IsAuthenticated()]


class BacDetailUpdateView(generics.RetrieveUpdateAPIView):
    """
    GET /api/v1/bacs/{id}/ — Détail d'un bac
    PATCH /api/v1/bacs/{id}/ — Modification d'un bac (Admin)
    """
    queryset = Bac.objects.all()
    serializer_class = BacSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT']:
            return [EstAdmin()]
        return [IsAuthenticated()]


class BacsProchesView(APIView):
    """
    GET /api/v1/bacs/proches/ — Bacs actifs autour d'une position GPS (public, inscription citoyen)
    """
    permission_classes = [AllowAny]

    def get(self, request):
        lat = request.query_params.get('latitude')
        lng = request.query_params.get('longitude')
        bacs = Bac.objects.filter(statut=StatutBac.ACTIF)
        results = []
        user_lat = float(lat) if lat else None
        user_lng = float(lng) if lng else None

        for bac in bacs:
            b_lat = float(bac.latitude) if bac.latitude is not None else None
            b_lng = float(bac.longitude) if bac.longitude is not None else None
            dist = None
            if user_lat is not None and user_lng is not None and b_lat is not None and b_lng is not None:
                d_lat = math.radians(b_lat - user_lat)
                d_lng = math.radians(b_lng - user_lng)
                a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(user_lat)) * math.cos(math.radians(b_lat)) * math.sin(d_lng / 2) ** 2
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                dist = round(6371000 * c, 1)

            results.append({
                'code': bac.code,
                'residence': bac.residence,
                'latitude': b_lat,
                'longitude': b_lng,
                'distance_m': dist,
            })

        if user_lat is not None and user_lng is not None:
            results.sort(key=lambda x: x['distance_m'] if x['distance_m'] is not None else float('inf'))

        return Response(results)
