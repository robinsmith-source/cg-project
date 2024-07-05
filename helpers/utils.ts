export function createShader(gl: WebGL2RenderingContext, type:any, source: string) {
    const shader = gl.createShader(type) as WebGLShader;
    if (!shader) {
        throw new Error('Shader creation failed');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    switch (type) {
        case gl.VERTEX_SHADER:
            console.error("VERTEX SHADER " + gl.getShaderInfoLog(shader));
            break;
        case gl.FRAGMENT_SHADER:
            console.error("FRAGMENT SHADER " + gl.getShaderInfoLog(shader));
            break;
        default:
            console.error(gl.getShaderInfoLog(shader));
            break;
    }
    gl.deleteShader(shader);
    return undefined;
}

export function createProgram(gl :WebGL2RenderingContext, vertexShader : WebGLShader, fragmentShader : WebGLShader) {
    const program = gl.createProgram() as WebGLProgram;
    if (!vertexShader || !fragmentShader) {
        throw new Error('Shader creation failed');
    }
    if (!program) {
        throw new Error('Program creation failed');
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return undefined;
}

export function loadTextResource(url : string) {
    return new Promise(function (resolve, reject) {
        let request = new XMLHttpRequest();
        // add a query string with random content, otherwise the browser may cache the file and not reload properly
        request.open("GET", url + "?please-dont-cache=" + Math.random(), true);
        request.onload = function () {
            if (request.status === 200) {
                resolve(request.responseText);
            } else {
                reject("Error: HTTP Status " + request.status + " on resource " + url);
            }
        }
        request.send();
    });
}