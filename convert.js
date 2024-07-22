// 선택된 파일들을 저장할 배열과 변환된 파일들의 Blob 객체를 저장할 객체
let filesArray = [];
let fileBlobs = {};

// 품질 슬라이더와 숫자 입력 필드를 동기화하는 함수
document.getElementById('qualityInput').addEventListener('input', function() {
    const value = this.value;
    document.getElementById('qualityValue').textContent = value;
    document.getElementById('qualityNumberInput').value = value;
});

document.getElementById('qualityNumberInput').addEventListener('input', function() {
    const value = this.value;
    document.getElementById('qualityValue').textContent = value;
    document.getElementById('qualityInput').value = value;
});


// 파일 입력 필드의 변경 이벤트 처리
document.getElementById('fileInput').addEventListener('change', function() {
    filesArray = Array.from(this.files); // 선택된 파일들을 배열로 변환하여 저장
    updateFileList(); // 파일 목록을 업데이트
});

// 파일 목록을 업데이트하는 함수
function updateFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';

    filesArray.forEach(file => {
        const fileItem = createFileItem(file); // 파일 항목을 생성
        fileList.appendChild(fileItem); // 파일 목록에 파일 항목을 추가
    });
}


// 파일 항목을 생성하는 함수
function createFileItem(file) {
    const fileItem = document.createElement('div');

    const fileName = document.createElement('span');
    fileName.classList.add('file-name');
    fileName.textContent = file.name;

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteButton.classList.add('delete-button');

    fileItem.appendChild(fileName);
    fileItem.appendChild(deleteButton);

    // 삭제 버튼 클릭 이벤트 처리
    deleteButton.addEventListener('click', function() {
        filesArray = filesArray.filter(f => f !== file); // filesArray에서 해당 파일 제거
        fileItem.remove(); // 해당 파일 항목을 DOM에서 제거
    });


    return fileItem;
}


// 변환 버튼 클릭 이벤트 처리
document.getElementById('convertButton').addEventListener('click', function() {
    const qualityInput = document.getElementById('qualityInput').value;
    const downloadLinksDiv = document.getElementById('downloadLinks');
    const progressDiv = document.getElementById('progress');
    const downloadAllButton = document.getElementById('downloadAllButton');
    downloadLinksDiv.innerHTML = '';
    progressDiv.innerHTML = '';
    downloadAllButton.style.display = 'none';

    if (filesArray.length > 0) {
        let completed = 0;
        fileBlobs = {}; // 변환된 파일 블롭 초기화

        filesArray.forEach((file, index) => {
            const reader = new FileReader();// FileReader는 JavaScript의 내장 객체로, 웹 애플리케이션이 비동기적으로 파일을 읽을 수 있게 해줍니다.

            reader.onload = function(event) {
                // 이미지 로드 후 캔버스에 그림
                // img 객체가 이미지를 성공적으로 로드하면, onload 이벤트가 발생합니다.
                // 이 이벤트 핸들러 내에서 이미지를 캔버스에 그린 후, canvas.toBlob을 사용하여 이미지를 WebP 형식의 Blob으로 변환합니다.
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    // 블롭은 웹 브라우저에서 텍스트, 이미지, 비디오 등 다양한 형식의 데이터를 다룰 때 사용할 수 있습니다.
                    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
                    canvas.toBlob(function(blob) {
                        const url = URL.createObjectURL(blob);
                        const downloadLink = document.createElement('a');
                        const downloadItem = document.createElement('div');
                        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, ""); // 확장자 제거
                        const downloadFileName = `${fileNameWithoutExt}.webp`;
                        const thumbnailDiv = document.createElement('div');
                        const thumbnail = document.createElement('img');
                        thumbnailDiv.classList.add('thumbnail');
                        thumbnail.src = url;
                        thumbnail.addEventListener('click', function() {
                            document.getElementById('imageModal').style.display = 'block';
                            document.getElementById('previewImage').src = url;
                        });
                        document.querySelector('.close').addEventListener('click', function() {
                            document.getElementById('imageModal').style.display = 'none';
                        });

                        downloadLink.href = url;
                        downloadLink.download = downloadFileName;
                        downloadLink.textContent = `Download ${downloadFileName}`;

                        const fileSize = blob.size >= 1024 * 1024
                            ? (blob.size / (1024 * 1024)).toFixed(2) + ' MB'
                            : (blob.size / 1024).toFixed(2) + ' KB';
                        const fileSizeText = document.createElement('span');
                        fileSizeText.textContent = `(${fileSize})`;

                        downloadItem.appendChild(downloadLink);
                        downloadItem.appendChild(fileSizeText);
                        thumbnailDiv.appendChild(thumbnail);
                        downloadItem.appendChild(thumbnailDiv);
                        downloadLinksDiv.appendChild(downloadItem);

                        // ZIP 파일에 추가
                        fileBlobs[downloadFileName] = blob;

                        // 진행 상태 업데이트
                        completed++;
                        progressDiv.textContent = `변환: ${completed} / ${filesArray.length}`;

                        if (completed === filesArray.length) {
                            downloadAllButton.style.display = 'block';
                        }
                        console.log('qualityInput',qualityInput)
                    }, 'image/webp', qualityInput / 100);
                };
                console.log('event',event)
                img.src = event.target.result;
                //  document.querySelector('.preview-img').appendChild(img);
            };
            //파일의 내용을 base64 형식의 Data URL로 변환합니다.
            reader.readAsDataURL(file);
        });

        // 모두 다운로드 버튼 클릭 이벤트 처리
        downloadAllButton.addEventListener('click', function() {
            // 변환된 이미지가 존재하는지 확인합니다.
            if (Object.keys(fileBlobs).length > 0) {
                const zip = new JSZip();
                // 변환된 각 이미지를 zip 파일에 추가합니다.
                Object.keys(fileBlobs).forEach(fileName => {
                    zip.file(fileName, fileBlobs[fileName]);// // 파일 이름과 Blob 데이터를 zip 파일에 추가합니다.
                });

                // zip 파일을 Blob 형태로 생성합니다.
                zip.generateAsync({ type: "blob" }).then(function(content) {
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(content);
                    link.download = "images.zip";
                    link.click();
                });
            } else {
                alert('다운로드 할 이미지가 없습니다.');
            }
        });
    } else {
        alert('1개 이상의 파일을 선택해주세요.');
    }
});

// 초기화 버튼 클릭 이벤트 처리
document.getElementById('resetButton').addEventListener('click', function() {
    filesArray = [];
    fileBlobs = {};
    document.getElementById('fileList').innerHTML = '';
    document.getElementById('fileInput').value = '';
    document.getElementById('downloadLinks').innerHTML = '';
    document.getElementById('progress').innerHTML = '';
    document.getElementById('downloadAllButton').style.display = 'none';
});