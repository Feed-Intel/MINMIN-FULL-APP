from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CommentViewSet, TagViewSet, UserBookmarksViewSet, ShareViewSet

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='posts')
router.register(r'comments', CommentViewSet, basename='comments')
router.register(r'tags', TagViewSet, basename='tags')
router.register(r'user/bookmarks', UserBookmarksViewSet, basename='user-bookmarks')
router.register(r'posts/(?P<post_pk>[^/.]+)/shares', ShareViewSet, basename='post-shares') #see all shares for a specific post
router.register(r'posts/(?P<post_pk>[^/.]+)/stats/', PostViewSet, basename='post-stats')
urlpatterns = [
    path('', include(router.urls)),
]
