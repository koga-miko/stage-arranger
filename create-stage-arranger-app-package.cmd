cd /d "%~dp0"
mkdir stage-arranger-app
mkdir stage-arranger-app\frontend
xcopy frontend\build stage-arranger-app\frontend\build /E /Y /I
xcopy node_modules stage-arranger-app\node_modules /E /Y /I
xcopy src stage-arranger-app\src /E /Y /I
copy index.js stage-arranger-app\
copy stage-arranger-app.cmd stage-arranger-app\
copy .env stage-arranger-app\
git log --oneline -n 1 > stage-arranger-app\version.txt
cd frontend
npm run build
pause
