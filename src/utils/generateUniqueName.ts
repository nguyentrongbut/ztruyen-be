export async function generateUniqueName(userModel, name: string) {
  let newName = name;
  let count = 0;

  while (await userModel.exists({ name: newName })) {
    count++;
    newName = `${name}_${Math.floor(Math.random() * 10000)}`;
    if (count > 5) break;
  }

  return newName;
}