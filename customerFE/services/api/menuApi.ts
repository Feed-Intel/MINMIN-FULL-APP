import { apiClient } from '@/config/axiosConfig';
import { asyncHandler } from '@/utils/asyncHandler';

export const GetMenus = asyncHandler(
  async (searchTerm?: string, noPage?: boolean) => {
    if (searchTerm) {
      const resp = await apiClient.get(`/menu/?search=${searchTerm}`);
      return resp.data.results;
    }
    if (noPage) {
      const resp = await apiClient.get(`/menu/?nopage=1`);
      return resp.data;
    }
    const resp = await apiClient.get('/menu/');
    return resp.data.results || [];
  }
);

export const GetRecommendedMenus = asyncHandler(async () => {
  const resp = await apiClient.get('/menu-availability/recommended_items/');
  return resp.data;
});

export const GetBestDishOfWeek = asyncHandler(async () => {
  const resp = await apiClient.get('/menu-availability/best_dishes_of_week/');
  return resp.data;
});

export const GetMenu = asyncHandler(async (id: string) => {
  const resp = await apiClient.get(`/menu/${id}/`);
  return resp.data;
});

export const CreateMenu = asyncHandler(async (data: FormData) => {
  const resp = await apiClient.post('/menu/', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return resp.data;
});

export const UpdateMenu = asyncHandler(async (data: FormData, id: string) => {
  const resp = await apiClient.patch(`/menu/${id}/`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return resp.data;
});

export const DeleteMenu = asyncHandler(async (id: string) => {
  const resp = await apiClient.delete(`/menu/${id}/`);
  return resp.data;
});

export const GetMenuAvailabilities = asyncHandler(async (data: any) => {
  if (data.searchTerm) {
    const resp = await apiClient.get(
      `/menu-availability/?search=${data.searchTerm}`
    );
    return resp.data.results || [];
  }
  const resp = await apiClient.get(`/menu-availability/?page_size=50`);
  return resp.data.results || [];
});

export const SearchMenuAvailabilities = asyncHandler(async (data: any) => {
  if (data.searchTerm) {
    const resp = await apiClient.get(`/menu-availability/?${data.searchTerm}`);
    return resp.data.results || [];
  }
  const resp = await apiClient.get(`/menu-availability/?page_size=50`);
  return resp.data.results || [];
});

export const GetMenuAvailabilitiesCategory = asyncHandler(async () => {
  const resp = await apiClient.get(`/menu-availability/available_categories/`);
  return resp.data;
});

export const GetMenuAvailabilities2 = async (data: {
  searchTerm?: string;
  filters?: string;
  nextPage?: string;
}) => {
  try {
    let url = '/menu-availability/';
    const params = new URLSearchParams();
    if (data.nextPage) {
      const page = data.nextPage.split('page=')[1];
      ////("this is the parsed url", page);
      url = `/menu-availability/?page=${page}`;
    } else {
      // Build initial request with search and filters
      if (data.searchTerm) {
        params.append('search', data.searchTerm);
      }

      if (data.filters) {
        // Parse filters into individual parameters
        const filterParams = new URLSearchParams(data.filters);
        filterParams.forEach((value, key) => {
          params.append(key, value);
        });
      }

      // Only add params if we have any
      if ([...params].length > 0) {
        url += `?${params.toString()}`;
      }
    }
    ////(url);
    const resp = await apiClient.get(url);

    // Ensure consistent response format
    return {
      results: resp.data?.results || [],
      next: resp.data?.next || null,
      previous: resp.data?.previous || null,
      count: resp.data?.count || 0,
    };
  } catch (error) {
    console.error('Failed to fetch menus:', error);
    throw new Error('Failed to load menu availability data');
  }
};

// export const GetMenuAvailabilities2 = asyncHandler(async (data: any) => {
// if (data.searchTerm) {
//   const resp = await apiClient.get(
//     `/menu-availability/?search=${data.searchTerm}`
//   );
//   return resp.data;
// }
// if (data.filters) {
//   const resp = await apiClient.get(`/menu-availability/?${data.filters}`);
//   //////(resp.data);
//   return resp.data;
// }
//   const resp = await apiClient.get("/menu-availability/");

//   return resp.data;
// });
export const CreateMenuAvailability = asyncHandler(async (data: any) => {
  const resp = await apiClient.post(`/menu-availability/`, data);
  return resp.data.results;
});

export const GetRelatedItems = asyncHandler(async () => {
  const resp = await apiClient.get('/related-menu/');
  return resp.data.results;
});

export const GetRelatedItem = asyncHandler(async (id: string) => {
  const resp = await apiClient.get(`/related-menu/${id}/`);
  return resp.data;
});

export const CreateRelatedItem = asyncHandler(async (data: any) => {
  const resp = await apiClient.post('/related-menu/', data);
  return resp.data;
});

export const UpdateRelatedItem = asyncHandler(async (data: any) => {
  const resp = await apiClient.patch(`/related-menu/${data.id}/`, data);
  return resp.data;
});

export const DeleteRelatedItem = asyncHandler(async (id: string) => {
  const resp = await apiClient.delete(`/related-menu/${id}/`);
  return resp.data;
});
