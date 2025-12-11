import { useMutation, useQuery } from '@tanstack/react-query';
import {
  CreateRelatedItem,
  GetBestDishOfWeek,
  GetMenu,
  GetMenuAvailabilities,
  GetMenuAvailabilities2,
  GetMenuAvailabilitiesCategory,
  GetMenus,
  GetRecommendedMenus,
  GetRelatedItem,
  GetRelatedItems,
  SearchMenuAvailabilities,
  UpdateRelatedItem,
} from '../api/menuApi';
import { MenuAvailability, MenuType, RelatedMenu } from '@/types/menuType';

export const useGetMenus = (searchTerm?: string, noPage?: boolean) =>
  useQuery<MenuType[]>({
    queryKey: ['menus', searchTerm, noPage],
    queryFn: () => GetMenus(searchTerm, noPage),
  });

export const useRecommendedMenus = () =>
  useQuery<MenuAvailability[]>({
    queryKey: ['recommendedMenus'],
    queryFn: GetRecommendedMenus,
  });

export const useBestDishOfWeek = () =>
  useQuery<MenuAvailability[]>({
    queryKey: ['bestDishOfWeek'],
    queryFn: GetBestDishOfWeek,
  });

export const useGetMenu = (id: string) =>
  useQuery<MenuType>({
    queryKey: ['menu', id],
    queryFn: () => GetMenu(id),
  });

export const useGetMenuAvailabilities = (searchTerm?: string) =>
  useQuery<MenuAvailability[]>({
    queryKey: ['menuAvailability', searchTerm],
    queryFn: () => GetMenuAvailabilities({ searchTerm }),
  });

export const useSearchMenuAvailabilities = (searchTerm?: string) =>
  useQuery<MenuAvailability[]>({
    queryKey: ['menuAvailability', 'filter', searchTerm],
    queryFn: () => SearchMenuAvailabilities({ searchTerm }),
  });

export const useGetMenuAvailabilitiesCategory = () =>
  useQuery<MenuAvailability[]>({
    queryKey: ['menuAvailabilityCategory'],
    queryFn: () => GetMenuAvailabilitiesCategory(),
  });

// export const useGetMenuAvailabilities2 = (searchTerm: string, filters: string) =>
//     useQuery<MenuAvailability[]>({
//     queryKey: ["menuAvailability", searchTerm, filters],
//     queryFn: () => GetMenuAvailabilities2({searchTerm, filters }),
//   })

export interface PaginatedMenuResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MenuAvailability[];
}

export const useGetMenuAvailabilities2 = (
  searchTerm: string,
  filters: string,
  nextPage?: string
) =>
  useQuery<PaginatedMenuResponse>({
    queryKey: ['menuAvailability2', searchTerm, filters, nextPage],
    queryFn: () => GetMenuAvailabilities2({ searchTerm, filters, nextPage }),
  });

//   return useQuery({
//     queryKey: ["menus", searchTerm, filters],
//     queryFn: () =>
//       apiClient
//         .get("/menus/", {
//           params: {
//             search: searchTerm,
//             ...filters,
//           },
//         })
//         .then((res) => res.data),
//   });
// };

export const useGetRelatedMenus = () =>
  useQuery<RelatedMenu[]>({
    queryKey: ['relatedMenus'],
    queryFn: GetRelatedItems,
  });

export const useGetRelatedMenuItem = (id: string) =>
  useQuery<RelatedMenu>({
    queryKey: ['relatedMenu', id],
    queryFn: () => GetRelatedItem(id),
  });

export const useAddRelatedMenuItem = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) =>
  useMutation({
    mutationKey: ['addRelatedMenuItem'],
    mutationFn: CreateRelatedItem,
    onSuccess,
    onError,
  });

export const useUpdateRelatedMenuItem = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) =>
  useMutation({
    mutationKey: ['updateRelatedMenuItem'],
    mutationFn: UpdateRelatedItem,
    onSuccess,
    onError,
  });

// export const useSearchMenu = () =>
//   useMutation({
//     mutationKey: ["searchMenu"],
//     mutationFn: searchMenu,
//   });
