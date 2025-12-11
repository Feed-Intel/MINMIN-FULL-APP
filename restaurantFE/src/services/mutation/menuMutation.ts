import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryFunction,
  MutationFunction,
} from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import {
  CreateMenu,
  CreateRelatedItem,
  DeleteMenu,
  DeleteRelatedItem,
  GetMenu,
  GetMenuAvailabilities,
  GetMenus,
  GetRelatedItem,
  GetRelatedItems,
  UpdateMenu,
  UpdateMenuAvailability,
  UpdateRelatedItem,
} from '../api/menuApi';
import {
  MenuAvailability,
  MenuQueryParams,
  MenuType,
  RelatedMenu,
} from '@/types/menuType';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';
// Removed 'useTime' and 'manualInvalidate'

// --- Type Definitions and Query Keys ---

interface PaginatedMenuResponse {
  next: string | null;
  results: MenuType[];
  count: number;
}
interface PaginatedAvailabilityResponse {
  next: string | null;
  results: MenuAvailability[];
  count: number;
}

const menuKeys = {
  all: ['menus'] as const,
  lists: () => [...menuKeys.all, 'list'] as const,
  list: (params?: MenuQueryParams, noPage?: boolean) =>
    [...menuKeys.lists(), { params, noPage }] as const,
  details: () => [...menuKeys.all, 'detail'] as const,
  detail: (id: string) => [...menuKeys.details(), id] as const,
  availabilities: () => [...menuKeys.all, 'availabilities'] as const,
  availabilityList: (params?: MenuQueryParams | null) =>
    [...menuKeys.availabilities(), { params }] as const,
};

const relatedMenuKeys = {
  all: ['relatedMenus'] as const,
  lists: () => [...relatedMenuKeys.all, 'list'] as const,
  list: (page?: number, noPage?: boolean) =>
    [...relatedMenuKeys.lists(), { page, noPage }] as const,
  details: () => [...relatedMenuKeys.all, 'detail'] as const,
  detail: (id: string) => [...relatedMenuKeys.details(), id] as const,
};

// ------------------------------------
// ## Menu Queries
// ------------------------------------

export const useGetMenus = (params?: MenuQueryParams, noPage?: boolean) => {
  const queryKey = menuKeys.list(params, noPage);

  const queryFn: QueryFunction<PaginatedMenuResponse, typeof queryKey> = ({
    queryKey: [, , { params: currentParams, noPage: currentNoPage }],
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(currentParams ?? {}).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, String(value));
      }
    });
    return GetMenus(searchParams.toString(), currentNoPage);
  };

  return useQuery({
    queryKey,
    queryFn,
  });
};

export const useGetMenu = (id: string) => {
  const queryKey = menuKeys.detail(id);

  const queryFn: QueryFunction<MenuType, typeof queryKey> = ({
    queryKey: [, , menuId],
  }) => GetMenu(menuId);

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!id,
  });
};

export const useGetMenuAvailabilities = (param?: MenuQueryParams | null) => {
  const queryKey = menuKeys.availabilityList(param);

  const queryFn: QueryFunction<
    PaginatedAvailabilityResponse,
    typeof queryKey
  > = ({
    queryKey: [, , { params: currentParams } = { params: undefined }],
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(currentParams ?? {}).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, String(value));
      }
    });
    return GetMenuAvailabilities(searchParams.toString());
  };

  return useQuery({
    queryKey,
    queryFn,
  });
};

// ------------------------------------
// ## Related Menus Queries
// ------------------------------------

export const useGetRelatedMenus = (
  page?: number | undefined,
  noPage?: boolean
) => {
  const queryKey = relatedMenuKeys.list(page, noPage);

  const queryFn: QueryFunction<RelatedMenu[], typeof queryKey> = ({
    queryKey: [, , { page: currentPage, noPage: currentNoPage }],
  }) => GetRelatedItems(currentPage, currentNoPage);

  return useQuery({
    queryKey,
    queryFn,
  });
};

export const useGetRelatedMenuItem = (id: string) => {
  const queryKey = relatedMenuKeys.detail(id);

  const queryFn: QueryFunction<RelatedMenu, typeof queryKey> = ({
    queryKey: [, , menuId],
  }) => GetRelatedItem(menuId);

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!id,
  });
};

// ------------------------------------
// ## Menu Mutations
// ------------------------------------

export const useCreateMenu = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (variables: any) => CreateMenu(variables),
    onMutate: () => dispatch(showLoader()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() });
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      if (onError) onError(error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
};

export const useUpdateMenu = (id: string) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (variables: FormData) => UpdateMenu(id, variables),
    onMutate: () => dispatch(showLoader()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() });
      queryClient.setQueryData(menuKeys.detail(id), data);
    },
    onError: (error) => {
      console.error('Error updating menu:', error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
};

export const useDeleteMenu = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (id: any) => DeleteMenu(id),
    onMutate: () => dispatch(showLoader()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() });
    },
    onError: (error) => {
      console.error('Error deleting menu:', error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
};

export const useUpdateMenuAvailability = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (variables: any) => UpdateMenuAvailability(variables),
    onMutate: () => dispatch(showLoader()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: menuKeys.availabilities(),
      });
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      if (onError) onError(error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
};

// ------------------------------------
// ## Related Menu Mutations
// ------------------------------------

export const useAddRelatedMenuItem = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (variables: any) => CreateRelatedItem(variables),
    onMutate: () => dispatch(showLoader()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: relatedMenuKeys.lists() });
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      if (onError) onError(error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
};

export const useUpdateRelatedMenuItem = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (variables: any) => UpdateRelatedItem(variables),
    onMutate: () => dispatch(showLoader()),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: relatedMenuKeys.lists() });
      // Assuming 'variables' contains the ID of the related item for cache update
      if (variables.id) {
        queryClient.setQueryData(relatedMenuKeys.detail(variables.id), data);
      }
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      if (onError) onError(error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
};

export const useDeleteRelatedMenu = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (id: any) => DeleteRelatedItem(id),
    onMutate: () => dispatch(showLoader()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: relatedMenuKeys.lists() });
    },
    onError: (error) => {
      console.error('Error deleting related menu:', error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
};
