import { useMutation, useQuery } from '@tanstack/react-query';
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
import { MenuAvailability, MenuType, RelatedMenu } from '@/types/menuType';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';

export const useGetMenus = (page?: number | null) =>
  useQuery<{ next: string | null; results: MenuType[]; count: number }>({
    queryKey: ['menus', page],
    queryFn: () => GetMenus(page),
    staleTime: 0,
  });

export const useGetMenu = (id: string) =>
  useQuery<MenuType>({
    queryKey: ['menu', id],
    queryFn: () => GetMenu(id),
    staleTime: 0,
  });

export const useGetMenuAvailabilities = (next?: string | null) =>
  useQuery<{ next: string | null; results: MenuAvailability[]; count: number }>(
    {
      queryKey: ['menuAvailability', next],
      queryFn: () => GetMenuAvailabilities(next),
      staleTime: 0,
    }
  );

export const useGetRelatedMenus = () =>
  useQuery<RelatedMenu[]>({
    queryKey: ['relatedMenus'],
    queryFn: GetRelatedItems,
    staleTime: 0,
  });

export const useCreateMenu = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationKey: ['createMenu'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return CreateMenu(data);
    },
    onSuccess: (data) => {
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

  return useMutation({
    mutationFn: (data: FormData) => {
      dispatch(showLoader());
      return UpdateMenu(id, data);
    },
    onError: () => dispatch(hideLoader()),
    onSettled: () => dispatch(hideLoader()),
  });
};

export const useDeleteRelatedMenu = () => {
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationKey: ['deleteMenu'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return DeleteRelatedItem(data);
    },
    onError: () => dispatch(hideLoader()),
    onSettled: () => dispatch(hideLoader()),
  });
};

export const useGetRelatedMenuItem = (id: string) =>
  useQuery<RelatedMenu>({
    queryKey: ['relatedMenu', id],
    queryFn: () => GetRelatedItem(id),
    staleTime: 0,
  });

export const useUpdateMenuAvailability = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return UpdateMenuAvailability(data);
    },
    onSuccess: (data) => {
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

  return useMutation({
    mutationKey: ['addRelatedMenuItem'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return CreateRelatedItem(data);
    },
    onSuccess: (data) => {
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

  return useMutation({
    mutationKey: ['updateRelatedMenuItem'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return UpdateRelatedItem(data);
    },
    onSuccess: (data) => {
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

  return useMutation({
    mutationKey: ['deleteMenu'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return DeleteMenu(data);
    },
    onError: () => dispatch(hideLoader()),
    onSettled: () => dispatch(hideLoader()),
  });
};
