export function frameKey(type, color, index) {
  return `car-${type}-${color}-${index}`;
}

export function loadCarFrames(scene, entry, color, frameCount) {
  scene.load.setPath(entry.path(color));
  for (let i = 0; i < frameCount; i += 1) {
    scene.load.image(frameKey(entry.id, color, i), entry.file(color, i));
  }
}

export function updateCarFrame(car, scene, heading, entry, color, frameCount) {
  if (!car || !scene?.textures.exists(frameKey(entry.id, color, 0))) {
    return;
  }
  const full = Math.PI * 2;
  const normalized = (heading + full) % full;
  const index = Math.round((normalized / full) * frameCount) % frameCount;
  const key = frameKey(entry.id, color, index);
  if (scene.textures.exists(key)) {
    car.setTexture(key);
  }
}

export function swapCar(scene, car, entry, color, frameCount, heading) {
  if (!scene.textures.exists(frameKey(entry.id, color, 0))) {
    loadCarFrames(scene, entry, color, frameCount);
    scene.load.once("complete", () => {
      updateCarFrame(car, scene, heading, entry, color, frameCount);
    });
    scene.load.start();
    return;
  }
  updateCarFrame(car, scene, heading, entry, color, frameCount);
}
