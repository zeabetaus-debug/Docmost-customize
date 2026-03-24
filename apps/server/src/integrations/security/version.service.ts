import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Resolve nearest package.json at runtime by walking up parent directories.
const packageJson = (() => {
  try {
    let cur = __dirname;
    while (true) {
      const candidate = path.join(cur, 'package.json');
      if (fs.existsSync(candidate)) {
        const raw = fs.readFileSync(candidate, 'utf8');
        return JSON.parse(raw);
      }
      const parent = path.dirname(cur);
      if (parent === cur) break;
      cur = parent;
    }
  } catch (err) {
    /* empty */
  }
  return {} as Record<string, any>;
})();

@Injectable()
export class VersionService {
  constructor() {}

  async getVersion() {
    const url = `https://api.github.com/repos/docmost/docmost/releases/latest`;

    let latestVersion = 0;
    try {
      const response = await fetch(url);
      if (!response.ok) return;
      const data = await response.json();
      latestVersion = data?.tag_name?.replace('v', '');
    } catch (err) {
      /* empty */
    }

    return {
      currentVersion: packageJson?.version,
      latestVersion: latestVersion,
      releaseUrl: 'https://github.com/docmost/docmost/releases',
    };
  }
}
