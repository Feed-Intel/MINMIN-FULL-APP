import { apiClient } from '@/config/axiosConfig';
import { asyncHandler } from '@/util/asyncHandler';

export const GetMenus = asyncHandler(
  async (params?: string | null, noPage?: boolean) => {
    if (noPage) {
      const resp = await apiClient.get(`/menu/?nopage=1`);
      return resp.data;
    }
    const resp = await apiClient.get(`/menu?${params}`);
    return resp.data;
  }
);

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

export const UpdateMenu = asyncHandler(async (id: string, data: FormData) => {
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

export const GetMenuAvailabilities = asyncHandler(
  async (param?: string | null) => {
    const resp = await apiClient.get(`/menu-availability?${param}`);
    return resp.data;
  }
);

// export const CreateMenuAvailability = asyncHandler(async (data: any) => {
//   const resp = await apiClient.post("/menu-availability/", data);
//   return resp.data;
// });

export const UpdateMenuAvailability = asyncHandler(async (data: any) => {
  const resp = await apiClient.post(`/menu-availability/`, data);
  return resp.data;
});

export const DeleteMenuAvailability = asyncHandler(async (id: string) => {
  const resp = await apiClient.delete(`/menu-availability/${id}/`);
  return resp.data;
});

export const GetRelatedItems = asyncHandler(
  async (page?: number | undefined, noPage?: boolean | undefined) => {
    if (noPage) {
      const resp = await apiClient.get(`/related-menu/?nopage=1`);
      return resp.data;
    } else if (Boolean(page)) {
      const resp = await apiClient.get(`/related-menu/?page=${page}`);
      return resp.data.results;
    }
    const resp = await apiClient.get('/related-menu/');
    return resp.data.results;
  }
);

export const GetRelatedItem = asyncHandler(async (id: string) => {
  const resp = await apiClient.get(`/related-menu/${id}/`);
  return resp.data;
});

export const CreateRelatedItem = asyncHandler(async (data: any) => {
  const resp = await apiClient.post('/related-menu/bulk-create/', data);
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
