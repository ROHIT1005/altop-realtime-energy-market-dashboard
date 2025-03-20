from django.urls import path
from . import views

urlpatterns = [
    path('miso-rt-data/', views.get_miso_rtdata, name='miso-rt-data'),
] 