{{/*
  Backend Deployment (Laravel via php-fpm + nginx sidecar).
  Consumer usage:
    # templates/deployment-backend.yaml
    {{ include "maya-common.backend" . }}
*/}}
{{- define "maya-common.backend" -}}
{{- if .Values.backend.enabled -}}
{{- $component := "backend" -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "maya-common.componentName" (dict "root" . "component" $component) }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "maya-common.componentLabels" (dict "root" . "component" $component) | nindent 4 }}
spec:
  replicas: {{ .Values.backend.replicas }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      {{- include "maya-common.componentSelectorLabels" (dict "root" . "component" $component) | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "maya-common.componentSelectorLabels" (dict "root" . "component" $component) | nindent 8 }}
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        {{- with .Values.backend.podAnnotations }}
        {{- toYaml . | nindent 8 }}
        {{- end }}
    spec:
      {{- with .Values.image.pullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ .Values.serviceAccountName | default "default" }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      terminationGracePeriodSeconds: {{ .Values.terminationGracePeriodSeconds | default 30 }}
      containers:
        - name: app
          image: {{ include "maya-common.image" (dict "root" .Values "componentImage" .Values.backend.image) }}
          imagePullPolicy: {{ .Values.image.pullPolicy | default "IfNotPresent" }}
          env:
            - name: CONTAINER_ROLE
              value: "api"
          envFrom:
            {{- include "maya-common.envFrom" . | nindent 12 }}
          ports:
            - name: fpm
              containerPort: {{ .Values.backend.fpmPort | default 9000 }}
              protocol: TCP
          resources:
            {{- toYaml .Values.backend.resources | nindent 12 }}
          securityContext:
            {{- toYaml .Values.containerSecurityContext | nindent 12 }}
          lifecycle:
            {{- include "maya-common.preStop" . | nindent 12 }}
          volumeMounts:
            {{- include "maya-common.runtimeVolumeMounts" . | nindent 12 }}
            {{- include "maya-common.mediaVolumeMounts" . | nindent 12 }}
        - name: nginx
          image: {{ .Values.backend.nginx.image | default "nginx:1.29-alpine" }}
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: {{ .Values.backend.httpPort | default 8000 }}
              protocol: TCP
          livenessProbe:
            {{- toYaml .Values.backend.livenessProbe | nindent 12 }}
          readinessProbe:
            {{- toYaml .Values.backend.readinessProbe | nindent 12 }}
          resources:
            {{- toYaml (.Values.backend.nginx.resources | default (dict "requests" (dict "cpu" "25m" "memory" "32Mi") "limits" (dict "cpu" "200m" "memory" "64Mi"))) | nindent 12 }}
          securityContext:
            {{- toYaml .Values.containerSecurityContext | nindent 12 }}
          lifecycle:
            {{- include "maya-common.preStop" . | nindent 12 }}
          volumeMounts:
            - name: nginx-config
              mountPath: /etc/nginx/conf.d/default.conf
              subPath: default.conf
            - name: nginx-tmp
              mountPath: /var/cache/nginx
            - name: nginx-run
              mountPath: /var/run
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: nginx-config
          configMap:
            name: {{ include "maya-common.fullname" . }}-nginx
        - name: nginx-tmp
          emptyDir: {}
        - name: nginx-run
          emptyDir: {}
        {{- include "maya-common.runtimeVolumes" . | nindent 8 }}
        {{- include "maya-common.mediaVolumes" . | nindent 8 }}
      {{- with .Values.backend.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.backend.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.backend.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
{{- end -}}
{{- end -}}
