{{/*
  Media PVC (RWX on the maya-nfs StorageClass).

  Only DMS sets storage.enabled=true. Mounted via subPath at
  /var/www/html/storage/app/media so only the media subtree lives on NFS
  (storage/framework, bootstrap/cache and storage/logs stay on ephemeral
  emptyDir to keep readOnlyRootFilesystem semantics).
*/}}
{{- define "maya-common.pvc" -}}
{{- if and .Values.storage .Values.storage.enabled -}}
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: {{ include "maya-common.fullname" . }}-media
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "maya-common.componentLabels" (dict "root" . "component" "media") | nindent 4 }}
  annotations:
    # PVCs are intentionally NOT deleted on `helm uninstall` to avoid losing
    # uploaded media. To purge, delete the PVC manually.
    "helm.sh/resource-policy": keep
spec:
  accessModes:
    - {{ .Values.storage.accessMode | default "ReadWriteMany" }}
  storageClassName: {{ .Values.storage.storageClassName | default "maya-nfs" }}
  resources:
    requests:
      storage: {{ .Values.storage.size | default "20Gi" }}
{{- end -}}
{{- end -}}
