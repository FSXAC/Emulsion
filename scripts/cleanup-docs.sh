#!/bin/bash
# Delete redundant documentation files (content consolidated into README.md)

rm -f /home/mhe/dev/Emulsion/DEPLOY.md
rm -f /home/mhe/dev/Emulsion/PRODUCTION.md
rm -f /home/mhe/dev/Emulsion/QUICKSTART.md
rm -f /home/mhe/dev/Emulsion/backend/README.md
rm -f /home/mhe/dev/Emulsion/frontend/README.md

echo "Deleted redundant documentation files:"
echo "  - DEPLOY.md"
echo "  - PRODUCTION.md"
echo "  - QUICKSTART.md"
echo "  - backend/README.md"
echo "  - frontend/README.md"
