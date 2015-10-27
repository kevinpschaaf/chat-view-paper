org=${1:-"kevinpschaaf"}
repo=${2:-"chat-view-paper"}
branch=${3:-"master"}

rm -rf deploy
git clone -b $branch --single-branch git@github.com:$org/$repo.git deploy

pushd deploy >/dev/null

git checkout -b deploy

bower install

polybuild index.html
mv index.build.html index.html
rm -rf components
cp ../elements/threads.json .

git add -A .
git commit -am 'update gh-pages'
git push -u origin deploy:gh-pages --force

popd >/dev/null
