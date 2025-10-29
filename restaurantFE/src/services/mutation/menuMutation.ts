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
import { useTime } from '@/context/time';

export const useGetMenus = (params?: MenuQueryParams, noPage?: boolean) => {
  const { time } = useTime();
  return useQuery<{ next: string | null; results: MenuType[]; count: number }>({
    queryKey: ['menus', params, time],
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
};

export const useGetMenu = (id: string) => {
  const { time } = useTime();
  return useQuery<MenuType>({
    queryKey: ['menu', id, time],
    queryFn: () => GetMenu(id),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useGetMenuAvailabilities = (param?: MenuQueryParams | null) => {
  const { time } = useTime();
  return useQuery<{
    next: string | null;
    results: MenuAvailability[];
    count: number;
  }>({
    queryKey: ['menuAvailability', param, time],
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
  });
};

export const useGetRelatedMenus = (
  page?: number | undefined,
  noPage?: boolean
) => {
  const { time } = useTime();
  return useQuery<RelatedMenu[]>({
    queryKey: ['relatedMenus', time],
    queryFn: () => GetRelatedItems(page, noPage),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useCreateMenu = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const { setTime } = useTime();
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
      setTime(Date.now());
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
  const { setTime } = useTime();
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
      setTime(Date.now());
    },
    onError: () => dispatch(hideLoader()),
    onSettled: () => dispatch(hideLoader()),
  });
};

export const useDeleteRelatedMenu = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const { setTime } = useTime();
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
      setTime(Date.now());
    },
    onError: () => dispatch(hideLoader()),
    onSettled: () => dispatch(hideLoader()),
  });
};

export const useGetRelatedMenuItem = (id: string) => {
  const { time } = useTime();
  return useQuery<RelatedMenu>({
    queryKey: ['relatedMenu', id, time],
    queryFn: () => GetRelatedItem(id),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useUpdateMenuAvailability = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const { setTime } = useTime();
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
      setTime(Date.now());
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
  const { setTime } = useTime();
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
      setTime(Date.now());
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
  const { setTime } = useTime();
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
      setTime(Date.now());
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
  const { setTime } = useTime();
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
      setTime(Date.now());
    },
    onError: () => dispatch(hideLoader()),
    onSettled: () => dispatch(hideLoader()),
  });
};
