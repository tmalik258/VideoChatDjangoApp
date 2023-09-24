from django.shortcuts import render


# Create your views here.
def lobby(request):
    return render(request, "chat/lobby.html")


def room(request):
    return render(request, "chat/room.html")
