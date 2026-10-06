export type ZipEntry = { readonly name: string; readonly bytes: Uint8Array };
const table = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit++)
    crc = (crc & 1) !== 0 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});
export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes)
    crc = (table[(crc ^ byte) & 255] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
export function zip(entries: readonly ZipEntry[]): Buffer {
  if (entries.length > 65535) throw new Error("ZIP64_NOT_SUPPORTED");
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  const names = new Set<string>();
  let offset = 0;
  for (const entry of Array.from(entries).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  )) {
    if (
      !/^[\w./-]+$/.test(entry.name) ||
      entry.name.startsWith("/") ||
      entry.name
        .split("/")
        .some((part) => part === ".." || part === "" || part === ".") ||
      names.has(entry.name)
    )
      throw new Error("UNSAFE_ZIP_NAME");
    names.add(entry.name);
    const name = Buffer.from(entry.name, "utf8");
    const data = Buffer.from(entry.bytes);
    if (name.length > 65535 || data.length > 0xffffffff)
      throw new Error("ZIP64_NOT_SUPPORTED");
    const crc = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x0800, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(33, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(name.length, 26);
    local.push(header, name, data);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0);
    directory.writeUInt16LE(20, 4);
    directory.writeUInt16LE(20, 6);
    directory.writeUInt16LE(0x0800, 8);
    directory.writeUInt16LE(0, 10);
    directory.writeUInt16LE(0, 12);
    directory.writeUInt16LE(33, 14);
    directory.writeUInt32LE(crc, 16);
    directory.writeUInt32LE(data.length, 20);
    directory.writeUInt32LE(data.length, 24);
    directory.writeUInt16LE(name.length, 28);
    directory.writeUInt32LE(offset, 42);
    central.push(directory, name);
    offset += header.length + name.length + data.length;
    if (offset > 0xffffffff) throw new Error("ZIP64_NOT_SUPPORTED");
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}
