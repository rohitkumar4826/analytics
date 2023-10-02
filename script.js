document.addEventListener('DOMContentLoaded', () => {
    const getStatsButton = document.getElementById('getStatsButton');
    const statistics = document.getElementById('statistics');
    const totalBlogs = document.getElementById('totalBlogs');
    const longestTitle = document.getElementById('longestTitle');
    const privacyCount = document.getElementById('privacyCount');

    const searchQuery = document.getElementById('searchQuery');
    const searchButton = document.getElementById('searchButton');
    const searchResults = document.getElementById('searchResults');

    getStatsButton.addEventListener('click', () => {
        fetch('/api/blog-stats')
            .then(response => response.json())
            .then(data => {
                totalBlogs.textContent = data.totalBlogs;
                longestTitle.textContent = data.longestTitle;
                privacyCount.textContent = data.blogsWithPrivacy;
                statistics.style.display = 'block';
            })
            .catch(error => console.error(error));
    });

    searchButton.addEventListener('click', () => {
        const query = searchQuery.value.toLowerCase();
        if (query.trim() === '') {
            searchResults.innerHTML = '';
            return;
        }
        fetch("/api/blog-search", { method: 'POST', body: new URLSearchParams({ query: query }) })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                const results = data.searchResults;
                console.log('result', results);
                const resultItems = results.map(result => `
                    <div class="card">
                        <img src="${result.image_url}" alt="${result.title}">
                        <p>${result.title}</p>
                    </div>
                `);
                searchResults.innerHTML = resultItems.join('');
            })
            .catch(error => console.error(error));
    });
});
