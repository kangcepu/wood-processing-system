"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateStorageSettingRequestSchema, type UpdateStorageSettingRequest } from "@wps/contracts";
import { Button, Field, Input, LoadingSkeleton, useToast } from "@wps/ui";
import { CheckCircle2, XCircle } from "lucide-react";
import { PageContainer } from "../../../components/layout/page-container";
import {
  useIntegrationSettings,
  useStorageSetting,
  useTestStorageConnection,
  useUpdateIntegrationSetting,
  useUpdateStorageSetting,
} from "../../../hooks/use-settings-admin";
import { ApiError } from "../../../types/api";

export default function SettingsPage() {
  return (
    <PageContainer title="Pengaturan" description="Konfigurasi penyimpanan objek (MinIO) dan integrasi sistem eksternal.">
      <div className="space-y-6">
        <StorageSettingsForm />
        <IntegrationSettingsList />
      </div>
    </PageContainer>
  );
}

function StorageSettingsForm() {
  const toast = useToast();
  const storageSetting = useStorageSetting();
  const updateStorage = useUpdateStorageSetting();
  const testConnection = useTestStorageConnection();

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<UpdateStorageSettingRequest>({
    resolver: zodResolver(updateStorageSettingRequestSchema),
    defaultValues: {
      enabled: false,
      endpoint: "",
      port: 9000,
      useSsl: false,
      region: null,
      accessKey: "",
      secretKey: "",
      defaultBucket: "",
      publicUrlMode: "SIGNED",
      signedUrlExpirySeconds: 300,
      maxFileSizeBytes: 10 * 1024 * 1024,
      allowedMimeTypes: ["image/png", "image/jpeg", "application/pdf"],
      reason: "",
    },
  });

  useEffect(() => {
    if (!storageSetting.data) return;
    reset({
      enabled: storageSetting.data.enabled,
      endpoint: storageSetting.data.endpoint,
      port: storageSetting.data.port,
      useSsl: storageSetting.data.useSsl,
      region: storageSetting.data.region,
      accessKey: "",
      secretKey: "",
      defaultBucket: storageSetting.data.defaultBucket,
      publicUrlMode: storageSetting.data.publicUrlMode,
      signedUrlExpirySeconds: storageSetting.data.signedUrlExpirySeconds,
      maxFileSizeBytes: storageSetting.data.maxFileSizeBytes,
      allowedMimeTypes: storageSetting.data.allowedMimeTypes,
      reason: "",
    });
  }, [storageSetting.data, reset]);

  const onSubmit = handleSubmit((values) => {
    updateStorage.mutate(values, {
      onSuccess: () => toast.success("Pengaturan penyimpanan disimpan"),
      onError: (error) => toast.error("Gagal menyimpan", error instanceof ApiError ? error.message : undefined),
    });
  });

  const runTestConnection = async () => {
    try {
      const result = await testConnection.mutateAsync(getValues());
      if (result.ok) {
        toast.success("Koneksi berhasil", "Semua langkah pengujian berhasil.");
      } else {
        const failed = result.steps.find((step) => !step.ok);
        toast.error("Koneksi gagal", failed?.message ?? `Gagal pada langkah ${failed?.step}`);
      }
    } catch (error) {
      toast.error("Gagal menguji koneksi", error instanceof ApiError ? error.message : undefined);
    }
  };

  if (storageSetting.isLoading) return <LoadingSkeleton rows={6} />;

  return (
    <section className="card p-5">
      <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">Penyimpanan Objek (MinIO)</h2>
      <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(event) => void onSubmit(event)}>
        <Field label="Endpoint" required error={errors.endpoint?.message}>
          <Input {...register("endpoint")} placeholder="minio.internal" />
        </Field>
        <Field label="Port" required error={errors.port?.message}>
          <Input type="number" {...register("port", { valueAsNumber: true })} />
        </Field>
        <Field label="Access Key" required error={errors.accessKey?.message} hint="Kosongkan jika tidak ingin mengubah.">
          <Input {...register("accessKey")} autoComplete="off" />
        </Field>
        <Field label="Secret Key" required error={errors.secretKey?.message} hint="Kosongkan jika tidak ingin mengubah.">
          <Input type="password" {...register("secretKey")} autoComplete="off" />
        </Field>
        <Field label="Default Bucket" required error={errors.defaultBucket?.message}>
          <Input {...register("defaultBucket")} />
        </Field>
        <Field label="Alasan Perubahan" required error={errors.reason?.message}>
          <Input {...register("reason")} placeholder="Wajib diisi untuk audit" />
        </Field>

        <div className="sm:col-span-2 flex items-center gap-4 border-t border-slate-100 pt-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register("enabled")} />
            Aktifkan penyimpanan objek
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register("useSsl")} />
            Gunakan SSL
          </label>
        </div>

        <div className="sm:col-span-2 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" loading={testConnection.isPending} onClick={() => void runTestConnection()}>
            Test Connection
          </Button>
          <Button type="submit" loading={updateStorage.isPending}>
            Simpan
          </Button>
        </div>
      </form>
    </section>
  );
}

function IntegrationSettingsList() {
  const integrations = useIntegrationSettings();
  const updateIntegration = useUpdateIntegrationSetting();
  const toast = useToast();

  if (integrations.isLoading) return <LoadingSkeleton rows={3} />;

  return (
    <section className="card p-5">
      <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">Integrasi Sistem Eksternal</h2>
      <div className="mt-4 space-y-3">
        {integrations.data?.map((integration) => (
          <div key={integration.system} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">{integration.system}</p>
              <p className="text-xs text-slate-400">Mode: {integration.mode}</p>
            </div>
            <div className="flex items-center gap-3">
              {integration.isEnabled ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 text-slate-300" />
              )}
              <Button
                variant="secondary"
                loading={updateIntegration.isPending}
                onClick={() =>
                  updateIntegration.mutate(
                    {
                      system: integration.system,
                      payload: { mode: integration.mode, baseUrl: integration.baseUrl, isEnabled: !integration.isEnabled },
                    },
                    { onSuccess: () => toast.success("Pengaturan integrasi diperbarui") },
                  )
                }
              >
                {integration.isEnabled ? "Nonaktifkan" : "Aktifkan"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
