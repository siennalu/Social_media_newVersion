# Social Media
## API測試(1)-註冊
  •	HTTP Method: POST
  
  •	URL:http://localhost:3000/register
  
  •	Body(x-www-form-urlencoded):  
  
    o userName: test
    o password: test 
    o email: test@gmail.com
    
## API測試(2)-登入
  •	HTTP Method: POST
  
  •	URL:http://localhost:3000/login
  
  •	Body(x-www-form-urlencoded):
  
    o password: test 
    o email: test@gmail.com
    
  •	於headers中取的token
## API測試(3)-修改
  •	HTTP Method: PUT
  
  •	URL:http://localhost:3000/update_user
  
  •	Headers:
  
    o Content-Type: application/x-www-form-urlencoded
    o token: 貼上登入取得的token
    
  •	Body(x-www-form-urlencoded):
  
    o userName: test
    o password: test123
    o email: test@gmail.com
    
 ## API測試(4)-查詢所有使用者
  •	HTTP Method: GET
  
  •	URL:http://localhost:3000/search_user
 
 ## API測試(5)-發送貼文
  •	HTTP Method: POST
  
  •	URL:http://localhost:3000/add_article
    
  •	Body(form-data):
  
    o authorID: 發文人的ID
    o title: test
    o userName: test
    o category: testing
    o privacy: private
    o content: test123
    o image: 選擇欲上傳的圖片
    o photoType: 圖片格式
    o video: 選擇欲上傳的影片
    o videoType: 影片格式
  
 ## API測試(6)-更改貼文
  •	HTTP Method: PUT
  
  •	URL:http://localhost:3000/update_article
    
  •	Body(form-data):
  
    o articleID: 複製發送貼文中的文章ID
    o content: test456
    o privacy: public
    o image: 選擇欲上傳的圖片
    o photoType: 圖片格式
    o video: 選擇欲上傳的影片
    o videoType: 影片格式
    
  
  ## API測試(7)-查詢全部貼文
  •	HTTP Method: GET
  
  •	URL:http://localhost:3000/search_article
    
    
  ## API測試(8)-透過文章ID查詢貼文
  •	HTTP Method: POST
  
  •	URL:http://localhost:3000/search_articleByArticleID
    
  •	Body(x-www-form-urlencoded):
  
    o articleID: 複製發送貼文中的文章ID
    
  ## API測試(9)-刪除貼文
  •	HTTP Method: PUT
  
  •	URL:http://localhost:3000/delete_article
    
  •	Body(x-www-form-urlencoded):
  
    o articleID: 複製發送貼文中的文章ID
    
  ## API測試(10)-使用者按讚
  •	HTTP Method: POST
  
  •	URL:http://localhost:3000/likes_article
    
  •	Body(x-www-form-urlencoded):
  
    o articleID: 複製發送貼文中的文章ID
    
    o likesPersonID: 按讚人的ID

  ## API測試(11)-使用者收回讚
  •	HTTP Method: PUT
  
  •	URL: http://localhost:3000/dislikes_article    
  
  •	Body(x-www-form-urlencoded):
  
    o articleID: 複製發送貼文中的文章ID
    
    o dislikesPersonID: 取消讚人的ID

  ## API測試(12)-使用者留言
  •	HTTP Method: POST
  
  •	URL: http://localhost:3000/add_comment    
  
  •	Body(form-data):
  
    o commenterID: test
    
    o articleID: 複製發送貼文中的文章ID
    
    o content: test	
    
    o image: 選擇欲上傳的圖片
    
    o photoType: 圖片格式
    
    o video: 選擇欲上傳的影片
    
    o videoType: 影片格式
    
  ## API測試(13)-使用者留言按讚
  •	HTTP Method: PUT
  
  •	URL: http://localhost:3000/likes_comment   
  
  •	Body(x-www-form-urlencoded):
  
    o commentID: 留言ID
    
    o likesPersonID: 按讚人的ID
   
  ## API測試(14)-使用者留言收回讚
  •	HTTP Method: PUT
  
  •	URL: http://localhost:3000/dislikes_comment        
  
  • Body(x-www-form-urlencoded):
  
    o commentID: 留言ID
    
    o dislikesPersonID: 取消讚人的ID
    
  ## API測試(15)-使用者刪除留言
  •	HTTP Method: PUT
  
  •	URL: http://localhost:3000/delete_comment        
  
  •Body(x-www-form-urlencoded):
  
    o commentID: 留言ID
    
  ## API測試(16)-使用者修改留言
  •	HTTP Method: PUT
  
  •	URL: http://localhost:3000/update_comment        
  
  •	Body(form-data):
  
    o commentID: 留言ID
    
    o content: test
    
    o image: 選擇欲上傳的圖片
    
    o photoType: 圖片格式
    
    o video: 選擇欲上傳的影片
    
    o videoType: 影片格式
    
  ## API測試(17)-使用者上傳背景照(封面照片)
  •	HTTP Method: POST
  
  •	URL: http://localhost:3000/upload_backgroundPhoto        
  
  •	Body(form-data):
  
    o userID: 使用者(註冊)的ID
    
    o image: 選擇欲上傳的圖片
    
    o photoType: 圖片格式
    
  ## API測試(18)-使用者上傳大頭照
  •	HTTP Method: POST
  
  •	URL: http://localhost:3000/upload_avatar        
  
  •	Body(form-data):
  
    o userID: 使用者(註冊)的ID
    
    o image: 選擇欲上傳的圖片
    
  ## API測試(19)-搜尋個人頁面
  •	HTTP Method: POST
  
  •	URL: http://localhost:3000/search_profile 
  
  • Body(x-www-form-urlencoded):
  
    o userID: 使用者(註冊)ID
   
  ## API測試(20)-透過UserID查詢貼文
  •	HTTP Method: POST
  
  •	URL: http://localhost:3000/search_profileByUserID     
  
  • Body(x-www-form-urlencoded):
  
    o userID: 使用者(註冊)ID
    
  ## API測試(21)-個人頁面設定
  •	HTTP Method: PUT
  
  •	URL: http://localhost:3000/profile_setting     
  
  • Body(x-www-form-urlencoded):
  
    o userID: 使用者(註冊)ID
    
    o userName: test
    
    o aboutMe: Hello
    
    o colorOfTheme: Black
    
 ## API測試(22)-追蹤好友
  •	HTTP Method: PUT
  
  •	URL: http://localhost:3000/friends_following     
  
  • Body(x-www-form-urlencoded):
  
    o userID_following: 追蹤人的ID
    
    o userID_followed: 被追蹤的ID
    
  ## API測試(23)-追蹤好友
  •	HTTP Method: PUT
  
  •	URL: http://localhost:3000/friends_unfollowing     
  
  • Body(x-www-form-urlencoded):
  
    o userID_following: 追蹤人的ID
    
    o userID_followed: 被追蹤的ID(欲取消的追蹤人ID)
    
  ## API測試(24)-新增好友
  •	HTTP Method: PUT
  
  •	URL: http://localhost:3000/friends_add     
  
  • Body(x-www-form-urlencoded):
  
    o userID: 新增人的ID
    
    o userID_add: 被新增的ID(欲新增為好友的ID)
    
  ## API測試(25)-取消好友
  •	HTTP Method: PUT
  
  •	URL: http://localhost:3000/friends_unadded     
  
  • Body(x-www-form-urlencoded):
  
    o userID: 取消人的ID
    
    o userID_add: 取消為好友的ID
    

    
   

   

   
    
