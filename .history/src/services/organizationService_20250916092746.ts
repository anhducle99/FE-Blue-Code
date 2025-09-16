import API from "./api";

export interface IOrganization {
  id?: number;
  name: string;
  created_at?: string;
}

export const getOrganizations = () =>
  API.get<IOrganization[]>("/organizations");
export const getOrganization = (id: number) =>
  API.get<IOrganization>(`/organizations/${id}`);
export const createOrganization = (data: Partial<IOrganization>) =>
  API.post("/organizations", data);
export const updateOrganization = (id: number, data: Partial<IOrganization>) =>
  API.put(`/organizations/${id}`, data);
export const deleteOrganization = (id: number) =>
  API.delete(`/organizations/${id}`);
