package com.task08;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.syndicate.deployment.annotations.lambda.LambdaHandler;
import com.syndicate.deployment.annotations.lambda.LambdaLayer;
import com.syndicate.deployment.model.RetentionSetting;
import com.syndicate.deployment.annotations.lambda.LambdaUrlConfig;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;

import com.openmeteo.sdk.WeatherApiResponse;
import com.google.gson.*;

import java.io.BufferedReader;
import java.net.HttpURLConnection;
import java.io.InputStreamReader;
import java.net.URL;

import java.util.*;

import com.syndicate.deployment.model.Architecture;
import com.syndicate.deployment.model.ArtifactExtension;
import com.syndicate.deployment.model.DeploymentRuntime;
import com.syndicate.deployment.model.RetentionSetting;
import com.syndicate.deployment.model.lambda.url.AuthType;
import com.syndicate.deployment.model.lambda.url.InvokeMode;

@LambdaHandler(lambdaName = "api_handler",
    roleName = "api_handler-role",
    isPublishVersion = false,
    layers = {"sdk-layer"},
    runtime = DeploymentRuntime.JAVA11,
    architecture = Architecture.ARM64,
    logsExpiration = RetentionSetting.SYNDICATE_ALIASES_SPECIFIED
)
@LambdaLayer(
    layerName = "sdk-layer",
    libraries = {
        "lib/commons-lang3-3.14.0.jar",
        "lib/gson-2.10.1.jar",
        "lib/sdk-1.10.0.jar",
        "lib/flatbuffers-java-23.5.26.jar"
    },
    runtime = DeploymentRuntime.JAVA11,
    architectures = {
        Architecture.ARM64
    },
    artifactExtension = ArtifactExtension.ZIP
)
@LambdaUrlConfig(
        authType = AuthType.NONE,
        invokeMode = InvokeMode.BUFFERED
)
public class ApiHandler implements RequestHandler < Object, Map < String, Object >> {

    public Map < String,
    Object > handleRequest(Object request, Context context) {
        String result = "";
        try {
            String urlStr = "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m";

            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();

            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept", "application/json");

            if (conn.getResponseCode() != 200) {
                throw new RuntimeException("Failed : HTTP error code : " +
                    conn.getResponseCode());
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder stringBuilder = new StringBuilder();

            String line;
            while ((line = reader.readLine()) != null) {
                  stringBuilder.append(line + "\r\n");
            }
            reader.close();

            Gson gson = new Gson();

            result = stringBuilder.toString();

        } catch (Exception ex) {}
        Map < String, Object > resultMap = new HashMap < String, Object > ();
        resultMap.put("statusCode", 200);
        resultMap.put("body", result);
        return resultMap;
    }


}

