ARG PYTHON_IMAGE
FROM ${PYTHON_IMAGE} AS builder
WORKDIR /build
COPY pyproject.toml ./
COPY regenai_assistant ./regenai_assistant
RUN pip wheel --no-cache-dir --wheel-dir /wheels .

FROM ${PYTHON_IMAGE} AS runtime
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir --no-index --find-links /wheels regenai-assistant \
    && rm -rf /wheels \
    && useradd --uid 10001 --create-home assistant
WORKDIR /app
USER 10001:10001
CMD ["regenai-assistant"]
