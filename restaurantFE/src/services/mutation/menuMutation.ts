import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export const useGetMenus = (params?: MenuQueryParams, noPage?: boolean) =>
  useQuery<{ next: string | null; results: MenuType[]; count: number }>({
    queryKey: ['menus', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, String(value));
        }
      });
      return GetMenus(searchParams.toString(), noPage);
    },
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });

export const useGetMenu = (id: string) =>
  useQuery<MenuType>({
    queryKey: ['menu', id],
    queryFn: () => GetMenu(id),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });

export const useGetMenuAvailabilities = (param?: MenuQueryParams | null) =>
  useQuery<{ next: string | null; results: MenuAvailability[]; count: number }>(
    {
      queryKey: ['menuAvailability', param],
      queryFn: () => {
        const searchParams = new URLSearchParams();
        Object.entries(param ?? {}).forEach(([key, value]) => {
          if (value) {
            searchParams.append(key, String(value));
          }
        });
        return GetMenuAvailabilities(searchParams.toString());
      },
      gcTime: 0,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: 60000,
    }
  );

export const useGetRelatedMenus = (
  page?: number | undefined,
  noPage?: boolean
) =>
  useQuery<RelatedMenu[]>({
    queryKey: ['relatedMenus'],
    queryFn: () => GetRelatedItems(page, noPage),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });

export const useCreateMenu = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['createMenu'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return CreateMenu(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      queryClient.refetchQueries({
        queryKey: ['menus'],
        type: 'active',
      });
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      dispatch(hideLoader());
      if (onError) onError(error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
};

export const useUpdateMenu = (id: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => {
      dispatch(showLoader());
      return UpdateMenu(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      queryClient.refetchQueries({
        queryKey: ['menus'],
        type: 'active',
      });
    },
    onError: () => dispatch(hideLoader()),
    onSettled: () => dispatch(hideLoader()),
  });
};

export const useDeleteRelatedMenu = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['deleteMenu'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return DeleteRelatedItem(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relatedMenus'] });
      queryClient.refetchQueries({
        queryKey: ['relatedMenus'],
        type: 'active',
      });
    },
    onError: () => dispatch(hideLoader()),
    onSettled: () => dispatch(hideLoader()),
  });
};

export const useGetRelatedMenuItem = (id: string) =>
  useQuery<RelatedMenu>({
    queryKey: ['relatedMenu', id],
    queryFn: () => GetRelatedItem(id),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });

export const useUpdateMenuAvailability = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return UpdateMenuAvailability(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menuAvailability'] });
      queryClient.refetchQueries({
        queryKey: ['menuAvailability'],
        type: 'active',
      });
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      dispatch(hideLoader());
      if (onError) onError(error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
};

export const useAddRelatedMenuItem = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['addRelatedMenuItem'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return CreateRelatedItem(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['relatedMenus'] });
      queryClient.refetchQueries({
        queryKey: ['relatedMenus'],
        type: 'active',
      });
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      dispatch(hideLoader());
      if (onError) onError(error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
};

export const useUpdateRelatedMenuItem = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['updateRelatedMenuItem'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return UpdateRelatedItem(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['relatedMenus'] });
      queryClient.refetchQueries({
        queryKey: ['relatedMenus'],
        type: 'active',
      });
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      dispatch(hideLoader());
      if (onError) onError(error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
};

export const useDeleteMenu = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['deleteMenu'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return DeleteMenu(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      queryClient.refetchQueries({
        queryKey: ['menus'],
        type: 'active',
      });
    },
    onError: () => dispatch(hideLoader()),
    onSettled: () => dispatch(hideLoader()),
  });
};
