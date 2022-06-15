"use strict";

import * as cg from "./cg.js";
import * as m4 from "./glmjs/mat4.js";
import * as v3 from "./glmjs/vec3.js";
import * as twgl from "./twgl-full.module.js";

async function main() {
  const ambientLight = document.querySelector("#ambient");
  const ambientLigthR = document.querySelector("#ambientR");
  const ambientLigthG = document.querySelector("#ambientG");
  const ambientLigthB = document.querySelector("#ambientB");
  const diffuseLight = document.querySelector("#diffuse");
  const diffuseLigthR = document.querySelector("#diffuseR");
  const diffuseLigthG = document.querySelector("#diffuseG");
  const diffuseLigthB = document.querySelector("#diffuseB");
  const lampara = document.querySelector("#lampara");
  const lamparaR = document.querySelector("#lamparaR");
  const lamparaG = document.querySelector("#lamparaG");
  const lamparaB = document.querySelector("#lamparaB");
  const canvitas = document.querySelector("#canvitas");
  const gl = canvitas.getContext("webgl2");
  if (!gl) return undefined !== console.log("WebGL 2.0 not supported");

  twgl.setDefaults({ attribPrefix: "a_" });

  const vertSrc = await fetch("glsl/pc2.vert").then((r) => r.text());
  const fragSrc = await fetch("glsl/pc2.frag").then((r) => r.text());
  const meshProgramInfo = twgl.createProgramInfo(gl, [vertSrc, fragSrc]);
  const cubex = await cg.loadObj(
    "models/cubito/cubito.obj",
    gl,
    meshProgramInfo,
  );

  const cratevertSrc = await fetch("glsl/pc2_2.vert").then((r) => r.text());
  const cratefragSrc = await fetch("glsl/pc2_2.frag").then((r) => r.text());
  const crateProgramInfo = twgl.createProgramInfo(gl, [cratevertSrc, cratefragSrc]);
  const crate = await cg.loadObj(
    "models/crate/crate.obj",
    gl,
    crateProgramInfo,
  );

  const vertSrcLS = await fetch("glsl/ls.vert").then((r) => r.text());
  const fragSrcLS = await fetch("glsl/ls.frag").then((r) => r.text());
  const lsProgramInfo = twgl.createProgramInfo(gl, [vertSrcLS, fragSrcLS]);
  const lightSource = await cg.loadObj(
    "models/cubito/cubito.obj",
    gl,
    lsProgramInfo,
  );

  const cam = new cg.Cam([0, -5, 25], 15);
  const rotationAxis = new Float32Array([0, 1, 0]);

  let aspect = 1;
  let deltaTime = 0;
  let lastTime = 0;
  let theta = 0;

  const numObjs = 10;
  const positions = new Array(numObjs);
  const delta = new Array(numObjs);
  const deltaG = -9.81;
  const rndb = (a, b) => Math.random() * (b - a) + a;
  for (let i = 0; i < numObjs; i++) {
    positions[i] = [
      rndb(-13.0, 13.0),
      rndb(6.0, 12.0),
      rndb(-13.0, 13.0),
    ];
    delta[i] = [rndb(-1.1, 1.1), 0.0, rndb(-1.1, 1.1)];
  }

  const numobjs2 = 2;
  const positions2 = new Array(numobjs2);
  positions2[0] = [-2, 0, 55];
  positions2[1] = [2, 0, 55];

  const uniforms = {
    u_world: m4.create(),
    u_projection: m4.create(),
    u_view: cam.viewM4,
  };

  const fragUniforms = {
    ambientStrength: 0,
    u_lightColor: new Float32Array([1, 1, 1]),//color de luz ambiental
    u_difflightColor: new Float32Array([1, 1, 1]),//color de luz difusa
    u_lightPosition: new Float32Array([0.0, 0.0, 0.0]),//posicion de la lampara
    diffuseIntensity: 0, //intensidad de lampara
    u_estaticdiffColor: new Float32Array([1, 1, 1]),//color de la lampara
    infinitediffIntensity: 0, //intensidad de la luz difusa infinita
    lintern_direction: cam.lookAt,
    lintern_color: new Float32Array([1, 1, 1]),//color de la linterna
    lintern_position: cam.pos,//posicion de la linterna
    u_viewPosition: cam.pos,//posicion de la camara
  };

  const crateLightUniforms = {
    u_ambientLight: new Float32Array([1.0, 1.0, 1.0]),
    u_lightPosition: new Float32Array([5.0, 0.0, 55.0]),
    u_viewPosition: cam.pos,
  };

  const lightRotAxis = new Float32Array([0.0, 0.0, 55.0]);
  const lightRotSource = new Float32Array([5.0, 0.0, 55.0]);

  const lsScale = new Float32Array([0.1, 0.1, 0.1]);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  function render(elapsedTime) {
    elapsedTime *= 1e-3;
    deltaTime = elapsedTime - lastTime;
    lastTime = elapsedTime;

    if (twgl.resizeCanvasToDisplaySize(gl.canvas)) {
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      aspect = gl.canvas.width / gl.canvas.height;
    }
    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    theta = elapsedTime;

    m4.identity(uniforms.u_projection);
    m4.perspective(uniforms.u_projection, cam.zoom, aspect, 0.1, 100);

    gl.useProgram(lsProgramInfo.program);
    m4.identity(uniforms.u_world);
    m4.translate(
      uniforms.u_world,
      uniforms.u_world,
      fragUniforms.u_lightPosition,
    );
    m4.scale(uniforms.u_world, uniforms.u_world, lsScale);
    twgl.setUniforms(lsProgramInfo, uniforms);
    twgl.setUniforms(lsProgramInfo, fragUniforms);

    for (const { bufferInfo, vao, material } of lightSource) {
      gl.bindVertexArray(vao);
      twgl.setUniforms(lsProgramInfo, {}, material);
      twgl.drawBufferInfo(gl, bufferInfo);
    }

    gl.useProgram(lsProgramInfo.program);
    m4.identity(uniforms.u_world);
    m4.translate(
      uniforms.u_world,
      uniforms.u_world,
      crateLightUniforms.u_lightPosition,
    );
    m4.scale(uniforms.u_world, uniforms.u_world, lsScale);
    twgl.setUniforms(lsProgramInfo, uniforms);
    twgl.setUniforms(lsProgramInfo, crateLightUniforms);

    for (const { bufferInfo, vao, material } of lightSource) {
      gl.bindVertexArray(vao);
      twgl.setUniforms(lsProgramInfo, {}, material);
      twgl.drawBufferInfo(gl, bufferInfo);
    }

    gl.useProgram(meshProgramInfo.program);

    v3.rotateY(
      crateLightUniforms.u_lightPosition,
      lightRotSource,
      lightRotAxis,
      -theta,
    );
    for (let i = 0; i < numObjs; i++) {
      m4.identity(uniforms.u_world);
      m4.translate(uniforms.u_world, uniforms.u_world, positions[i]);
      m4.rotate(uniforms.u_world, uniforms.u_world, theta, rotationAxis);
      twgl.setUniforms(meshProgramInfo, uniforms);
      twgl.setUniforms(meshProgramInfo, fragUniforms);

      for (const { bufferInfo, vao, material } of cubex) {
        gl.bindVertexArray(vao);
        twgl.setUniforms(meshProgramInfo, {}, material);
        twgl.drawBufferInfo(gl, bufferInfo);
      }

      // Update position
      for (let j = 0; j < 3; j++) {
        positions[i][j] += delta[i][j] * deltaTime;
        if (positions[i][j] > 13.0) {
          positions[i][j] = 13.0;
          delta[i][j] = -delta[i][j];
        } else if (positions[i][j] < -13.0) {
          positions[i][j] = -13.0;
          delta[i][j] = -delta[i][j];
        }
      }
      delta[i][1] += deltaG * deltaTime;
    }

    gl.useProgram(crateProgramInfo.program);
    for (let i = 0; i < numobjs2; i++) {
      m4.identity(uniforms.u_world);
      m4.translate(uniforms.u_world, uniforms.u_world, positions2[i]);
      twgl.setUniforms(crateProgramInfo, uniforms);
      twgl.setUniforms(crateProgramInfo, crateLightUniforms);

      for (const { bufferInfo, vao, material } of crate) {
        gl.bindVertexArray(vao);
        twgl.setUniforms(crateProgramInfo, {}, material);
        twgl.drawBufferInfo(gl, bufferInfo);
      }
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  document.addEventListener("keydown", (e) => {
    /**/ if (e.key === "w") cam.processKeyboard(cg.FORWARD, deltaTime);
    else if (e.key === "a") cam.processKeyboard(cg.LEFT, deltaTime);
    else if (e.key === "s") cam.processKeyboard(cg.BACKWARD, deltaTime);
    else if (e.key === "d") cam.processKeyboard(cg.RIGHT, deltaTime);
  });
  canvitas.addEventListener("mousemove", (e) => cam.movePov(e.x, e.y));
  canvitas.addEventListener("mousedown", (e) => cam.startMove(e.x, e.y));
  canvitas.addEventListener("mouseup", () => cam.stopMove());
  canvitas.addEventListener("wheel", (e) => cam.processScroll(e.deltaY));
  ambientLight.addEventListener("change", () => {
    const value = ambientLight.value;
    fragUniforms.ambientStrength = value / 100;
  });
  ambientLigthR.addEventListener("change", () => {
    const value = ambientLigthR.value;
    fragUniforms.u_lightColor[0] = value / 100;
  }
  );
  ambientLigthG.addEventListener("change", () => {
    const value = ambientLigthG.value;
    fragUniforms.u_lightColor[1] = value / 100;
  }
  );
  ambientLigthB.addEventListener("change", () => {
    const value = ambientLigthB.value;
    fragUniforms.u_lightColor[2] = value / 100;
  }
  );
  diffuseLight.addEventListener("change", () => {
    const value = diffuseLight.value;
    fragUniforms.infinitediffIntensity = value / 100;
  }
  );
  diffuseLigthR.addEventListener("change", () => {
    const value = diffuseLigthR.value;
    fragUniforms.u_difflightColor[0] = value / 100;
  }
  );
  diffuseLigthG.addEventListener("change", () => {
    const value = diffuseLigthG.value;
    fragUniforms.u_difflightColor[1] = value / 100;
  }
  );
  diffuseLigthB.addEventListener("change", () => {
    const value = diffuseLigthB.value;
    fragUniforms.u_difflightColor[2] = value / 100;
  }
  );
  lampara.addEventListener("change", () => {
    const value = lampara.value;
    fragUniforms.diffuseIntensity = value / 100;
  }
  );
  lamparaR.addEventListener("change", () => {
    const value = lamparaR.value;
    fragUniforms.u_estaticdiffColor[0] = value / 100;
  }
  );
  lamparaG.addEventListener("change", () => {
    const value = lamparaG.value;
    fragUniforms.u_estaticdiffColor[1] = value / 100;
  }
  );
  lamparaB.addEventListener("change", () => {
    const value = lamparaB.value;
    fragUniforms.u_estaticdiffColor[2] = value / 100;
  }
  );
}

main();
