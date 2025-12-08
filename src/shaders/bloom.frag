#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform vec2 u_mouse;   // button center
uniform float u_time;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec3 texColor = texture2D(u_texture, st).rgb;

    // --- Button region ---
    vec2 buttonCenter = u_mouse / u_resolution;
    float dist = distance(st, buttonCenter);

    float radius = 0.1; // normalized radius of the button
    float glow = smoothstep(radius, 0.0, dist); // 1.0 at center, 0 at edge

    // brighten only inside the circle
    vec3 color = texColor * (1.0 + 0.9 * glow); // 0.5 = intensity

    gl_FragColor = vec4(color, 1.0);
}
