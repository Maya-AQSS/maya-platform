{{/*
  Defense-in-depth NetworkPolicy. Defaults:
    - deny all ingress in the namespace except:
        * traffic from Traefik (kube-system / namespace label match)
        * traffic from allowed Maya namespaces (east-west)
    - egress allowed by default (DB, Keycloak, RabbitMQ, Redis live elsewhere)
*/}}
{{- define "maya-common.networkpolicy" -}}
{{- if .Values.networkPolicy.enabled -}}
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "maya-common.fullname" . }}-default
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "maya-common.labels" . | nindent 4 }}
spec:
  podSelector: {}
  policyTypes:
    - Ingress
  ingress:
    # Same-namespace traffic (sidecars, internal probes).
    - from:
        - podSelector: {}
    # Traefik in kube-system.
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: {{ .Values.networkPolicy.ingressNamespace | default "kube-system" }}
    {{- with .Values.networkPolicy.allowedNamespaces }}
    # Maya east-west (allowed namespaces calling this service).
    - from:
        {{- range . }}
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: {{ . }}
        {{- end }}
    {{- end }}
{{- end -}}
{{- end -}}
