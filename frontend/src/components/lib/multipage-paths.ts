import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { client } from "./client";
import { ArgumentTypes, ExtractData } from "./projects";
import { PermanentPath } from "@backend/src/interfaces/artboard";

const multipagePathsRoute = client.api.v0["multipage-paths"];
const multipagePathsRouteId = client.api.v0["multipage-paths"][":id"];

type SerializedMultipagePath = ExtractData<
  Awaited<ReturnType<typeof multipagePathsRouteId.$get>>
>["multipagePath"];

type CreateMultipagePathArgs = ArgumentTypes<
  typeof multipagePathsRoute.create.$post
>[0]["json"];

type UpdateMultipagePathArgs = ArgumentTypes<
  typeof multipagePathsRouteId.update.$post
>[0]["json"];

export function getMultipagePathsQueryOptions(args: { projectId: number }) {
  return queryOptions({
    queryKey: ["multipagePaths", args.projectId],
    queryFn: async () => {
      const res = await multipagePathsRoute[":projectId"].$get({
        param: { projectId: args.projectId.toString() },
      });
      if (!res.ok) {
        console.error("error getting paths: ", res);
        throw new Error("Failed to get all multipage paths.");
      }
      const { paths } = await res.json();
      return paths
        .map((paths) => paths.paths)
        .map(mapSerializedMultipagePathToSchema);
    },
  });
}

function mapSerializedMultipagePathToSchema(
  serialized: SerializedMultipagePath
): PermanentPath {
  return {
    ...serialized,
    createdAt: new Date(serialized.createdAt),
    editedAt: new Date(serialized.editedAt),
  };
}

async function createMultipagePath(path: CreateMultipagePathArgs) {
  const res = await multipagePathsRoute.create.$post({
    json: path,
  });
  if (!res.ok) {
    throw new Error("Failed to create multipage path.");
  }
  const { multipagePath } = await res.json();
  return mapSerializedMultipagePathToSchema(multipagePath);
}

export const useCreateMultipagePathMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMultipagePath,
    onSettled: (_, __, args) => {
      queryClient.invalidateQueries({
        queryKey: ["multipagePaths", args.projectId],
      });
    },
  });
};

async function updateMultipagePath(
  data: UpdateMultipagePathArgs & { multipagePathId: number }
) {
  const res = await multipagePathsRouteId.update.$post({
    json: data,
    param: { id: data.multipagePathId.toString() },
  });
  if (!res.ok) {
    throw new Error("Failed to update multipage path.");
  }
  const { multipagePath } = await res.json();
  return mapSerializedMultipagePathToSchema(multipagePath);
}

export const useUpdateMultipagePathMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMultipagePath,
    onSettled: (_, __, args) => {
      queryClient.invalidateQueries({
        queryKey: ["multipagePaths", args.projectId],
      });
    },
  });
};

async function deleteMultipagePath(args: {
  multipageId: number;
  projectId: number;
}) {
  const res = await multipagePathsRouteId.delete.$post({
    param: { id: args.multipageId.toString() },
  });
  if (!res.ok) {
    throw new Error("Failed to delete multipage path.");
  }
}

export const useDeleteMultipagePathMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMultipagePath,
    onSettled: (_, __, args) => {
      queryClient.invalidateQueries({
        queryKey: ["multipagePaths", args.projectId],
      });
    },
  });
};
