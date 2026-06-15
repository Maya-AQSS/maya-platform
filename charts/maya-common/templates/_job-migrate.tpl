{{/*
  Migration Job (helm pre-install + pre-upgrade hook).

  hook-delete-policy: before-hook-creation,hook-succeeded ensures the previous
  Job is GC'd before a new one is created (otherwise the second upgrade fails
  with "Job already exists") and successful Jobs are removed on success
  (failures stay around for postmortem).

  ⚠ helm rollback DOES NOT revert the DB schema. Migrations are forward-only;
  always take a Patroni backup before deploying.
*/}}
{{- define "maya-common.jobMigrate" -}}
{{- if .Values.migrate.enabled -}}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "maya-common.fullname" . }}-migrate
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "maya-common.componentLabels" (dict "root" . "component" "migrate") | nindent 4 }}
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  backoffLimit: {{ .Values.migrate.backoffLimit | default 1 }}
  activeDeadlineSeconds: {{ .Values.migrate.activeDeadlineSeconds | default 600 }}
  template:
    metadata:
      labels:
        {{- include "maya-common.componentSelectorLabels" (dict "root" . "component" "migrate") | nindent 8 }}
    spec:
      restartPolicy: Never
      {{- with .Values.image.pullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: migrate
          image: {{ include "maya-common.image" (dict "root" .Values "componentImage" .Values.migrate.image) }}
          imagePullPolicy: {{ .Values.image.pullPolicy | default "IfNotPresent" }}
          env:
            - name: CONTAINER_ROLE
              value: "migrate"
          envFrom:
            {{- include "maya-common.envFrom" . | nindent 12 }}
          {{- with .Values.migrate.command }}
          command:
            {{- toYaml . | nindent 12 }}
          {{- end }}
          resources:
            {{- toYaml .Values.migrate.resources | nindent 12 }}
          securityContext:
            {{- toYaml .Values.containerSecurityContext | nindent 12 }}
          volumeMounts:
            {{- include "maya-common.runtimeVolumeMounts" . | nindent 12 }}
      volumes:
        {{- include "maya-common.runtimeVolumes" . | nindent 8 }}
{{- end -}}
{{- end -}}
