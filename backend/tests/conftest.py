import os
import sys

# pytest's default import mode only adds this file's directory (tests/) to
# sys.path, not the backend root — without this, `import app` fails since
# `app` isn't an installed package, just a plain directory under backend/.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
