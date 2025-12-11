from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from accounts.permissions import HasCustomAPIKey
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from .models import Post, Comment, Tag, Share
from .serializers import PostSerializer, CommentSerializer, TagSerializer, ShareSerializer, UserStatsSerializer, CommentStatsSerializer, ShareStatsSerializer 
from .feedFilter import FeedFilter
class PostPagination(PageNumberPagination):
    page_size = 10

class PostViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for viewing, creating, updating, and deleting posts.
    """
    queryset = Post.objects.prefetch_related('comments').all().order_by("-time_ago")
    serializer_class = PostSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = FeedFilter
    permission_classes = [IsAuthenticated,HasCustomAPIKey]
    pagination_class = PostPagination
    def get_queryset(self):
        queryset = Post.objects.select_related(
            'user__tenants',
            'user__branch__tenant'
        ).prefetch_related('comments').order_by("-time_ago")
        
        user = self.request.user
        
        if user.user_type == 'restaurant':
            return queryset.filter(user=user)
        
        return queryset
    def perform_create(self, serializer):
        """Ensure the post is associated with the currently authenticated user."""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=["POST"])
    def like(self, request, pk=None):
        """
        Custom endpoint for liking/unliking a post.
        """
        post = self.get_object()
        user = request.user

        if user in post.likes.all():
            post.likes.remove(user)  # Unlike
            return Response({"message": "Unliked post"}, status=status.HTTP_200_OK)
        else:
            post.likes.add(user)  # Like
            return Response({"message": "Liked post"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["POST"])
    def bookmark(self, request, pk=None):
        post = self.get_object()
        user = request.user

        if user in post.bookmarks.all():
            post.bookmarks.remove(user)
            return Response({"message": "Removed from bookmarks"}, status=status.HTTP_200_OK)
        else:
            post.bookmarks.add(user)
            return Response({"message": "Added to bookmarks"}, status=status.HTTP_200_OK)
        
    @action(detail=True, methods=["POST"])
    def share(self, request, pk=None):
        post = self.get_object()
        Share.objects.create(
            post=post,
            user=request.user if request.user.is_authenticated else None
        )
        post.share_count += 1
        post.save()
        return Response({"message": "Post shared", "count": post.share_count}, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'], url_path='stats')
    def post_stats(self, request, pk=None):
        """
        Get detailed statistics for a specific post
        """
        post = self.get_object()
        
        # Get likes data
        likes = post.likes.all()
        likes_serializer = UserStatsSerializer(likes, many=True)
        
        # Get bookmarks data
        bookmarks = post.bookmarks.all()
        bookmarks_serializer = UserStatsSerializer(bookmarks, many=True)
        
        # Get comments data
        comments = post.comments.select_related('user').all()
        comments_serializer = CommentStatsSerializer(comments, many=True)
        
        # Get shares data
        all_shares = post.shares.all()
        shares = post.shares.select_related('user').all()
        shares_serializer = ShareStatsSerializer(shares, many=True)
        
        data = {
            'likes': {
                'count': likes.count(),
                'users': likes_serializer.data
            },
            'bookmarks': {
                'count': bookmarks.count(),
                'users': bookmarks_serializer.data
            },
            'comments': {
                'count': comments.count(),
                'items': comments_serializer.data
            },
            'shares': {
                'count': all_shares.count(),
                'items': shares_serializer.data
            }
        }
        
        return Response(data, status=status.HTTP_200_OK)

class CommentPagination(PageNumberPagination):
    page_size = 20
class CommentViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for managing comments on posts.
    """
    queryset = Comment.objects.all().order_by("-created_at")
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated,HasCustomAPIKey]
    pagination_class = CommentPagination

    def perform_create(self, serializer):
        """Ensure the comment is associated with the currently authenticated user."""
        serializer.save(user=self.request.user)

class TagsPagination(PageNumberPagination):
    page_size = 50
class TagViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for managing tags.
    """
    queryset = Tag.objects.all().order_by("name")
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated,HasCustomAPIKey]
    pagination_class = TagsPagination

class UserBookmarksViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated, HasCustomAPIKey]
    pagination_class = PostPagination

    def get_queryset(self):
        return self.request.user.bookmarked_posts.all().order_by("-time_ago")
    
    
class ShareViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ShareSerializer
    permission_classes = [IsAuthenticated, HasCustomAPIKey]
    
    def get_queryset(self):
        return Share.objects.filter(post=self.kwargs['post_pk'])