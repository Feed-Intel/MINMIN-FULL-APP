import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTables,
  createTable,
  updateTable,
  deleteTable,
  createQR,
  fetchQRs,
  updateQr,
  fetchTableById,
  fetchDeliveryTables,
} from "../api/tableApi";
import { Table } from "@/types/tableTypes";

export const useDeliveryTables = ( branch: any ) =>
  useQuery<Table[]>({
    queryKey: ["deliveryTables"],
    queryFn: () => fetchDeliveryTables(branch),
  });
export const useQRs = () =>
  useQuery({
    queryKey: ["qrs"],
    queryFn: () => fetchQRs(),
  });
export function useCreateQR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      return createQR(data);
    },
    onError: (error: any) => {
      console.error("Error creating QR:", error);
    },
    onSuccess: () => {
      //("QR created successfully");
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["qrs"] });
      }
    },
  });
}
export function useUpdateQr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; qr: Partial<any> }) => {
      return updateQr(data.id, data.qr);
    },
    onError: (error: any) => {
      console.error("Error updating Qr:", error);
    },
    onSuccess: () => {
      //("Qr updated successfully");
      queryClient.invalidateQueries({ queryKey: ["qrs"] });
    },
    onSettled: () => {},
  });
}
export const useGetTables = () =>
  useQuery<Table[]>({
    queryKey: ["tables"],
    queryFn: () => fetchTables(),
  });

export const useGetTableById = (id: string) =>
  useQuery<Table>({
    queryKey: ["table", id],
    queryFn: () => fetchTableById(id),
  });
export function useCreateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Table>) => {
      return createTable(data);
    },
    onError: (error: any) => {
      console.error("Error creating table:", error);
    },
    onSuccess: () => {
      //("Table created successfully");
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["tables"] });
      }
    },
  });
}

export function useUpdateTable() {
  return useMutation({
    mutationFn: updateTable,
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return deleteTable(id);
    },
    onError: (error: any) => {
      console.error("Error deleting table:", error);
    },
    onSuccess: () => {
      //("Table deleted successfully");
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["tables"] });
      }
    },
  });
}
