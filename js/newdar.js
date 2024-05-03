$(document).ready(function() {
    'use strict';
    let prts=[
        {"name":"Abele, Arija","id":"189059","comeDay":"","address":"","amTime":""},
        {"name":"Abesamis, Purificacion","id":"PC4665","comeDay":"135","address":"","amTime":""},
        {"name":"Agemso, Woubishet","id":"490099","comeDay":"","address":"","amTime":""},
        {"name":"Akichika, Rowena","id":"693456","comeDay":"3","address":"","amTime":""},
        {"name":"Aldana, Eugenia","id":"490014","comeDay":"","address":"","amTime":""},
        {"name":"Anies, Cristeta","id":"693470","comeDay":"","address":"","amTime":""},
        {"name":"Arias, Lydia","id":"664978","comeDay":"","address":"","amTime":""},
        {"name":"Bajjalieh, Laila","id":"536349","comeDay":"","address":"","amTime":""},
        {"name":"Barrow, Joseph","id":"172980","comeDay":"","address":"","amTime":""},
        {"name":"Beck, Ora","id":"632940","comeDay":"5","address":"","amTime":""},
        {"name":"Bello, Christopher","id":"693509","comeDay":"","address":"","amTime":""},
        {"name":"Bian, John","id":"645728","comeDay":"","address":"","amTime":""},
        {"name":"Bishop Robinson, Jacqueline","id":"173290","comeDay":"","address":"","amTime":""},
        {"name":"Blake, Dera","id":"693517","comeDay":"24","address":"","amTime":""},
        {"name":"Bolden, Joseph","id":"534373","comeDay":"","address":"","amTime":""},
        {"name":"Bonilla, Yolanda","id":"188622","comeDay":"","address":"","amTime":""},
        {"name":"Bonner, Patricia","id":"PC7598","comeDay":"15","address":"","amTime":""},
        {"name":"Briggs, Sharon","id":"490028","comeDay":"4","address":"","amTime":""},
        {"name":"Burr, Sandra","id":"693544","comeDay":"1","address":"","amTime":""},
        {"name":"Cabrera De Interiano, Elva","id":"693551","comeDay":"","address":"","amTime":""},
        {"name":"Campbell, Stephan","id":"PC7599","comeDay":"5","address":"","amTime":""},
        {"name":"Canizalez, Graciela","id":"173296","comeDay":"","address":"","amTime":""},
        {"name":"Cao , Wan Ran","id":"195159","comeDay":"12345","address":"","amTime":""},
        {"name":"Carlsson, Sally","id":"PC8659","comeDay":"","address":"","amTime":""},
        {"name":"Carroll-Iturralde, Ruth","id":"490043","comeDay":"4","address":"","amTime":""},
        {"name":"Carroll, Robert","id":"PC7600","comeDay":"","address":"","amTime":""},
        {"name":"Cassidy, Betty","id":"693572","comeDay":"","address":"","amTime":""},
        {"name":"Chae, Dong","id":"632943","comeDay":"","address":"","amTime":""},
        {"name":"Chamberlin","id":"PC8563","comeDay":"","address":"","amTime":""},
        {"name":"Chan, Chung Wing","id":"501606","comeDay":"","address":"","amTime":""},
        {"name":"Chan, David","id":"PC4428","comeDay":"","address":"","amTime":""},
        {"name":"Chan, David L","id":"693589","comeDay":"3","address":"","amTime":"10:45"},
        {"name":"Chan, Kwai Hin","id":"181932","comeDay":"1","address":"","amTime":""},
        {"name":"Chan, Kwan Har","id":"501011","comeDay":"4","address":"","amTime":""},
        {"name":"Chan, Patricia","id":"180900","comeDay":"","address":"","amTime":""},
        {"name":"Chan, Phillip","id":"180886","comeDay":"","address":"","amTime":""},
        {"name":"Chan, Shirlena","id":"193244","comeDay":"","address":"","amTime":""},
        {"name":"Chan, Sook Wah","id":"173301","comeDay":"","address":"","amTime":""},
        {"name":"Chan, Sylvia","id":"693593","comeDay":"","address":"","amTime":""},
        {"name":"Chan, Wai Hing","id":"693594","comeDay":"","address":"","amTime":""},
        {"name":"Chang, Judy","id":"PC7569","comeDay":"","address":"","amTime":""},
        {"name":"Chao, Kwoh Chin","id":"693601","comeDay":"","address":"","amTime":""},
        {"name":"Chau, Polo","id":"633043","comeDay":"","address":"","amTime":""},
        {"name":"Chau, Simon","id":"PC8459","comeDay":"","address":"","amTime":""},
        {"name":"Chavez Lopez, Humberto","id":"490079","comeDay":"","address":"","amTime":""},
        {"name":"Chen, Annie","id":"PC21267","comeDay":"","address":"","amTime":""},
        {"name":"Chen, Buoy Lan ","id":"PC8509","comeDay":"12345","address":"","amTime":""},
        {"name":"Chen, Shun Hui","id":"490081","comeDay":"","address":"","amTime":""},
        {"name":"Chen, Yan Fang","id":"181660","comeDay":"","address":"","amTime":""},
        {"name":"Chen, Yiqun","id":"PC11141","comeDay":"","address":"","amTime":""},
        {"name":"Chen, Zuo Ren","id":"PC8510","comeDay":"","address":"","amTime":""},
        {"name":"Cheng, Guang Shun","id":"693611","comeDay":"24","address":"","amTime":""},
        {"name":"Cheng, James","id":"PC8986","comeDay":"","address":"","amTime":""},
        {"name":"Cheung, William","id":"633044","comeDay":"35","address":"","amTime":""},
        {"name":"Chin, Ang Lin","id":"PC8511","comeDay":"12345","address":"","amTime":""},
        {"name":"Chin, Anita","id":"PC14702","comeDay":"5","address":"","amTime":""},
        {"name":"Chou, Sio Cheong","id":"PC8512","comeDay":"135","address":"707293","amTime":""},
        {"name":"Chow, Yau S","id":"PC8513","comeDay":"14","address":"","amTime":""},
        {"name":"Chow, Yu Liang","id":"693621","comeDay":"3","address":"","amTime":""},
        {"name":"Chryst, Genn","id":"PC10374","comeDay":"","address":"","amTime":""},
        {"name":"Chu, Chen Xiao","id":"490373","comeDay":"","address":"","amTime":""},
        {"name":"Chu, Clyde","id":"693624","comeDay":"","address":"","amTime":""},
        {"name":"Chu, Kan","id":"173304","comeDay":"","address":"","amTime":""},
        {"name":"Chu, Kenneth","id":"633045","comeDay":"","address":"","amTime":""},
        {"name":"Chu, Kwai Lan","id":"501607","comeDay":"","address":"","amTime":""},
        {"name":"Chu, Pak","id":"PC8499","comeDay":"5","address":"","amTime":""},
        {"name":"Chu, Yin","id":"693625","comeDay":"","address":"","amTime":""},
        {"name":"Chung, Ann","id":"645941","comeDay":"","address":"","amTime":""},
        {"name":"Chung, Isaak","id":"PC8514","comeDay":"12345","address":"","amTime":""},
        {"name":"Chung, Suk W","id":"PC8515","comeDay":"12345","address":"","amTime":""},
        {"name":"Cornel, Rebecca","id":"490378","comeDay":"1345","address":"","amTime":""},
        {"name":"Cruz, Ruben","id":"PC10019","comeDay":"12345","address":"","amTime":""},
        {"name":"Curry, James","id":"693660","comeDay":"","address":"","amTime":""},
        {"name":"Dang, Tony","id":"693664","comeDay":"","address":"","amTime":""},
        {"name":"Dao, Ngoc Tu","id":"693665","comeDay":"12345","address":"","amTime":""},
        {"name":"Dao, Tran Tu","id":"693666","comeDay":"24","address":"185519","amTime":""},
        {"name":"Deguzman, Evangelina","id":"693680","comeDay":"","address":"","amTime":""},
        {"name":"Diaz, Humberto","id":"187920","comeDay":"","address":"","amTime":""},
        {"name":"Dixon, Miles","id":"693694","comeDay":"","address":"","amTime":""},
        {"name":"Doyle, Thomas","id":"693698","comeDay":"5","address":"","amTime":""},
        {"name":"Duong, Ban","id":"693703","comeDay":"","address":"","amTime":""},
        {"name":"Fan, HongYu","id":"693731","comeDay":"","address":"","amTime":""},
        {"name":"Fang, Yue Hua","id":"PC8517","comeDay":"4","address":"","amTime":""},
        {"name":"Ferrell, Wanda","id":"693735","comeDay":"","address":"","amTime":""},
        {"name":"Fischer, Felizitas","id":"693736","comeDay":"","address":"","amTime":""},
        {"name":"Fung, Lai King","id":"693757","comeDay":"14","address":"","amTime":""},
        {"name":"Fung, Yuk Leung","id":"693758","comeDay":"","address":"","amTime":""},
        {"name":"GAO, YI REN","id":"PC10682","comeDay":"","address":"","amTime":""},
        {"name":"Garcia-Maldonado, Aurelia","id":"693773","comeDay":"135","address":"","amTime":""},
        {"name":"Garcia, Agustin","id":"693766","comeDay":"","address":"","amTime":""},
        {"name":"Garcia, Dora","id":"173312","comeDay":"","address":"","amTime":""},
        {"name":"Garcia, Julio","id":"693769","comeDay":"1345","address":"","amTime":""},
        {"name":"Godinez, Luis ","id":"490397","comeDay":"12345","address":"","amTime":""},
        {"name":"Gormally, Mary  Sr.","id":"PC8518","comeDay":"","address":"","amTime":""},
        {"name":"Granados, Carlos","id":"693798","comeDay":"5","address":"","amTime":""},
        {"name":"Grant, Teri","id":"173313","comeDay":"","address":"","amTime":""},
        {"name":"Grossman, Murray","id":"693808","comeDay":"","address":"","amTime":""},
        {"name":"Gu, Guan Qun","id":"194426","comeDay":"245","address":"","amTime":""},
        {"name":"Guang, Guan","id":"PC13164","comeDay":"12345","address":"","amTime":""},
        {"name":"Guerra Ayala, Alma","id":"490404","comeDay":"1245","address":"","amTime":""},
        {"name":"Guevara, Judith","id":"490406","comeDay":"","address":"","amTime":""},
        {"name":"Harris, Janet","id":"693837","comeDay":"","address":"","amTime":""},
        {"name":"He, Ting Gui","id":"693841","comeDay":"","address":"","amTime":""},
        {"name":"He, Yu","id":"693842","comeDay":"","address":"","amTime":""},
        {"name":"Head, Sherrie","id":"173019","comeDay":"","address":"","amTime":""},
        {"name":"Hellam. Ruben ","id":"693846","comeDay":"2","address":"","amTime":""},
        {"name":"Hernandez, Marcia","id":"PC8519","comeDay":"","address":"","amTime":""},
        {"name":"Hernandez, Victoria","id":"491464","comeDay":"14","address":"","amTime":""},
        {"name":"Ho, Kim","id":"PC8520","comeDay":"","address":"","amTime":""},
        {"name":"Horne, Ronald","id":"693877","comeDay":"","address":"","amTime":""},
        {"name":"Huang Tam, Gui Ying","id":"PC8500","comeDay":"135","address":"","amTime":""},
        {"name":"Huang, Jing H","id":"492775","comeDay":"","address":"","amTime":""},
        {"name":"Huang, Shao Ming","id":"492789","comeDay":"","address":"","amTime":""},
        {"name":"Huang, Shu Fen","id":"492789","comeDay":"","address":"","amTime":""},
        {"name":"Huang, Zhao Huan","id":"693887","comeDay":"","address":"","amTime":""},
        {"name":"Hui, Wai Chan Ngai","id":"PC8522","comeDay":"","address":"","amTime":""},
        {"name":"Hung, Mei Shuang","id":"PC8523","comeDay":"5","address":"","amTime":""},
        {"name":"Huynh, Hi","id":"PC8524","comeDay":"1345","address":"","amTime":""},
        {"name":"Hwang, Soon","id":"PC15536","comeDay":"135","address":"","amTime":""},
        {"name":"Jackson, Kevin","id":"693904","comeDay":"","address":"","amTime":""},
        {"name":"James, Annie","id":"693907","comeDay":"","address":"","amTime":""},
        {"name":"Jin, Xue Lian","id":"693917","comeDay":"5","address":"","amTime":""},
        {"name":"Johnson, Willie","id":"PC8525","comeDay":"","address":"","amTime":""},
        {"name":"Jones, Elaine","id":"693920","comeDay":"","address":"","amTime":""},
        {"name":"Kelly, Dorothy Jane ","id":"PC8526","comeDay":"","address":"","amTime":""},
        {"name":"Kerfoot, Lori","id":"693939","comeDay":"","address":"","amTime":""},
        {"name":"Keung, Ping W","id":"PC8527","comeDay":"","address":"","amTime":""},
        {"name":"Kim, Hong","id":"177377","comeDay":"","address":"","amTime":""},
        {"name":"Kim, Lily","id":"501613","comeDay":"","address":"","amTime":""},
        {"name":"Kong, Fung Kuen","id":"173352","comeDay":"","address":"","amTime":""},
        {"name":"Kuang, Guo Ying","id":"693954","comeDay":"5","address":"","amTime":""},
        {"name":"Kwan, Peo L","id":"PC8528","comeDay":"","address":"","amTime":""},
        {"name":"Kwock, Ying Bing","id":"PC11543","comeDay":"1245","address":"","amTime":""},
        {"name":"Kwong, Chang Lin","id":"555550","comeDay":"","address":"","amTime":""},
        {"name":"Kwong, Chi Min","id":"693958","comeDay":"","address":"","amTime":""},
        {"name":"Lam, Phi Chiu ","id":"PC4643","comeDay":"35","address":"","amTime":""},
        {"name":"Lam, Thomas","id":"PC8530","comeDay":"14","address":"","amTime":""},
        {"name":"Lau, Kitwan (Wendy)","id":"PC8531","comeDay":"","address":"","amTime":""},
        {"name":"Lau, Yuk Yu","id":"PC17443","comeDay":"4","address":"","amTime":""},
        {"name":"Lea, Lai","id":"173387","comeDay":"12345","address":"","amTime":""},
        {"name":"Lee, Alydia","id":"PC16549","comeDay":"35","address":"","amTime":""},
        {"name":"Lee, Betty Lan-Yuen","id":"693977","comeDay":"135","address":"","amTime":""},
        {"name":"Lee, Choi Kuen","id":"PC8532","comeDay":"24","address":"","amTime":""},
        {"name":"Lee, Fung","id":"173155","comeDay":"2","address":"","amTime":""},
        {"name":"Lee, Gertrude","id":"PC15238","comeDay":"12345","address":"","amTime":""},
        {"name":"Lee, Har Tam","id":"536566","comeDay":"12345","address":"","amTime":""},
        {"name":"Lee, Lai Yee","id":"693985","comeDay":"135","address":"","amTime":""},
        {"name":"Lee, Lap Chow","id":"693986","comeDay":"45","address":"","amTime":""},
        {"name":"Lee, Larry","id":"693987","comeDay":"4","address":"","amTime":""},
        {"name":"Lee, May Jean","id":"PC8533","comeDay":"3","address":"","amTime":""},
        {"name":"Lee, Mui Chun","id":"173319","comeDay":"","address":"","amTime":""},
        {"name":"Lee, Ngan Chu","id":"693990","comeDay":"12","address":"","amTime":""},
        {"name":"Lee, Shuk F Lee","id":"PC8534","comeDay":"","address":"","amTime":""},
        {"name":"Lee, Sooja","id":"693992","comeDay":"","address":"","amTime":""},
        {"name":"Lei, Hon Wan","id":"597823","comeDay":"","address":"","amTime":""},
        {"name":"Leong, Steven","id":"173320","comeDay":"","address":"","amTime":""},
        {"name":"Leung, Frank","id":"501122","comeDay":"","address":"","amTime":""},
        {"name":"Leung, Hoi Man","id":"694002","comeDay":"","address":"","amTime":""},
        {"name":"Leung, Kwong Fat","id":"491474","comeDay":"","address":"","amTime":""},
        {"name":"Leung, Leisly","id":"501124","comeDay":"","address":"","amTime":""},
        {"name":"Leung, Ricky","id":"694004","comeDay":"","address":"","amTime":""},
        {"name":"Leung, Wing Kwai","id":"694006","comeDay":"","address":"","amTime":""},
        {"name":"Li, WenPing","id":"694010","comeDay":"","address":"","amTime":""},
        {"name":"Li, YongFu","id":"694012","comeDay":"3","address":"","amTime":""},
        {"name":"Liang, Guo Zhi","id":"PC9633","comeDay":"","address":"","amTime":""},
        {"name":"Liang, Huan Mei","id":"PC8535","comeDay":"","address":"","amTime":""},
        {"name":"Liang, Minan","id":"501143","comeDay":"","address":"","amTime":""},
        {"name":"Liang, Sai Huan","id":"694014","comeDay":"","address":"","amTime":""},
        {"name":"Lin , Chao Ping","id":"173321","comeDay":"","address":"","amTime":""},
        {"name":"Lipinski, Andrjez","id":"PC8536","comeDay":"","address":"","amTime":""},
        {"name":"Liu, Can Yao","id":"694023","comeDay":"","address":"","amTime":""},
        {"name":"Logan, Venitta","id":"PC13057","comeDay":"24","address":"","amTime":""},
        {"name":"Lu, Linda","id":"694043","comeDay":"","address":"","amTime":""},
        {"name":"Lu, Xiong","id":"694045","comeDay":"","address":"","amTime":""},
        {"name":"Lucas, Vivian","id":"694046","comeDay":"","address":"","amTime":""},
        {"name":"Luk Chiu, Fung Hin&#160; ","id":"694049","comeDay":"","address":"","amTime":""},
        {"name":"Luo, Hui Wei","id":"501602","comeDay":"3","address":"","amTime":""},
        {"name":"Luong, Vu","id":"694050","comeDay":"","address":"","amTime":""},
        {"name":"Luu, Muoi","id":"PC8537","comeDay":"","address":"","amTime":""},
        {"name":"Luu, To","id":"491467","comeDay":"","address":"","amTime":""},
        {"name":"Ly, Ha Bich","id":"555882","comeDay":"12345","address":"","amTime":""},
        {"name":"Ly, Mui","id":"694052","comeDay":"12345","address":"","amTime":""},
        {"name":"Ly, Trung","id":"PC7572","comeDay":"12345","address":"","amTime":""},
        {"name":"Lyons, Gregory","id":"694053","comeDay":"","address":"","amTime":""},
        {"name":"Ma Cui Hua","id":"PC14948","comeDay":"13","address":"","amTime":""},
        {"name":"Ma, Helen","id":"PC17163","comeDay":"3","address":"","amTime":"10:45"},
        {"name":"Ma, Kwan Shou","id":"694054","comeDay":"","address":"","amTime":""},
        {"name":"Ma, Rongan","id":"694055","comeDay":"","address":"","amTime":""},
        {"name":"Mac, Tam","id":"PC8538","comeDay":"","address":"","amTime":""},
        {"name":"Macdonald, Christopher","id":"PC21137","comeDay":"","address":"","amTime":""},
        {"name":"Majher John","id":"694158","comeDay":"","address":"","amTime":""},
        {"name":"Majher, John","id":"694066","comeDay":"","address":"","amTime":""},
        {"name":"Malek, Hossein","id":"650270","comeDay":"","address":"","amTime":""},
        {"name":"Mao, Lao","id":"173392","comeDay":"","address":"","amTime":""},
        {"name":"Martinez, Lawrence","id":"694085","comeDay":"","address":"","amTime":""},
        {"name":"Matosich, Helen","id":"694091","comeDay":"","address":"","amTime":""},
        {"name":"Matsuo, Emiko","id":"694092","comeDay":"145","address":"182519","amTime":""},
        {"name":"McCarthy, Steven","id":"PC15386","comeDay":"","address":"","amTime":""},
        {"name":"McKean, Rosemary","id":"536353","comeDay":"","address":"","amTime":""},
        {"name":"Mederos, Aquileo","id":"PC10934","comeDay":"14","address":"","amTime":""},
        {"name":"Mengesha, Hiwan","id":"694118","comeDay":"","address":"","amTime":""},
        {"name":"Miller, Marvin","id":"694124","comeDay":"","address":"","amTime":""},
        {"name":"Miller, Thomas","id":"PC8457","comeDay":"","address":"","amTime":""},
        {"name":"Montoya, Luis","id":"694138","comeDay":"2","address":"","amTime":""},
        {"name":"Moore Ernestine","id":"192111","comeDay":"","address":"","amTime":""},
        {"name":"Morley, Marilyn","id":"694154","comeDay":"","address":"","amTime":""},
        {"name":"Mui, Mee Thlu ","id":"PC4645","comeDay":"12345","address":"","amTime":""},
        {"name":"Ng, Kwai","id":"694172","comeDay":"","address":"","amTime":""},
        {"name":"Ng, Ping","id":"694173","comeDay":"","address":"","amTime":""},
        {"name":"Ng, Ping Jan","id":"694174","comeDay":"","address":"","amTime":""},
        {"name":"Ng, Po San","id":"694175","comeDay":"","address":"","amTime":""},
        {"name":"Ng, Sai Mun","id":"646480","comeDay":"","address":"","amTime":""},
        {"name":"Ng, Siu Har Yu","id":"PC8539","comeDay":"","address":"","amTime":""},
        {"name":"Nguyen, Kimtuyen","id":"PC8540","comeDay":"","address":"","amTime":""},
        {"name":"Nimau, John","id":"694183","comeDay":"","address":"","amTime":""},
        {"name":"Nudelman, Irina","id":"694190","comeDay":"","address":"","amTime":""},
        {"name":"Nunn, Sue Tsin","id":"694192","comeDay":"","address":"","amTime":""},
        {"name":"O'Connor, Frances","id":"694199","comeDay":"","address":"","amTime":""},
        {"name":"O'Connor, Marian","id":"PC8541","comeDay":"","address":"","amTime":""},
        {"name":"Oda Richard H","id":"PC14942","comeDay":"135","address":"","amTime":""},
        {"name":"Ornano-Lopez, Maria Del Pilar","id":"PC8542","comeDay":"","address":"","amTime":""},
        {"name":"Ornano, Julia","id":"597822","comeDay":"24","address":"","amTime":""},
        {"name":"Pal, Gary","id":"PC14034","comeDay":"","address":"","amTime":""},
        {"name":"Pan, Wiley","id":"501151","comeDay":"","address":"","amTime":""},
        {"name":"Pascal, Fabian","id":"694228","comeDay":"","address":"","amTime":""},
        {"name":"Pascual, Corozan","id":"PC10922","comeDay":"","address":"","amTime":""},
        {"name":"Peed, Leatrice","id":"694236","comeDay":"135","address":"182519","amTime":""},
        {"name":"Pegueros, Sandra","id":"534380","comeDay":"","address":"","amTime":""},
        {"name":"Penry, Paul","id":"694240","comeDay":"","address":"","amTime":""},
        {"name":"Perkins, Michael","id":"694243","comeDay":"","address":"","amTime":""},
        {"name":"Peterson, Samuel","id":"694245","comeDay":"","address":"","amTime":""},
        {"name":"Pho, Lina","id":"PC8543","comeDay":"24","address":"","amTime":""},
        {"name":"Pizzorno, Mary","id":"537567","comeDay":"1","address":"","amTime":""},
        {"name":"Porter, Gregory","id":"694260","comeDay":"","address":"","amTime":""},
        {"name":"Pugh, Michael","id":"PC18970","comeDay":"","address":"","amTime":""},
        {"name":"Quach, Miles","id":"694264","comeDay":"","address":"","amTime":""},
        {"name":"Ramos, Gladys","id":"694275","comeDay":"2","address":"","amTime":""},
        {"name":"Randleston, Edward","id":"694276","comeDay":"15","address":"","amTime":""},
        {"name":"Rapisura, Herminia","id":"694280","comeDay":"13","address":"","amTime":""},
        {"name":"Richardson, Mark","id":"694295","comeDay":"","address":"","amTime":""},
        {"name":"Romero, Judith","id":"694318","comeDay":"","address":"","amTime":""},
        {"name":"Salunga, Marissa","id":"PC10280","comeDay":"","address":"","amTime":""},
        {"name":"Seymour, Mary","id":"501474","comeDay":"","address":"","amTime":""},
        {"name":"Shen, Chang Rong","id":"694359","comeDay":"","address":"","amTime":""},
        {"name":"Situ, Zi Wei","id":"694374","comeDay":"","address":"","amTime":""},
        {"name":"Siu, Wah Bik","id":"PC8544","comeDay":"12","address":"","amTime":""},
        {"name":"Smiley, Patricia","id":"597820","comeDay":"24","address":"","amTime":""},
        {"name":"Stamps, Ivory","id":"694391","comeDay":"","address":"","amTime":""},
        {"name":"Stern, Mark","id":"694394","comeDay":"","address":"","amTime":""},
        {"name":"Sun, Ruilian","id":"173331","comeDay":"","address":"185519","amTime":""},
        {"name":"Swimmer, John","id":"PC9620","comeDay":"5","address":"","amTime":""},
        {"name":"Takikawa, Noriko","id":"PC19110","comeDay":"5","address":"","amTime":""},
        {"name":"Tam, Wai Ken","id":"490313","comeDay":"","address":"","amTime":""},
        {"name":"Tan, Eileen","id":"PC8545","comeDay":"","address":"","amTime":""},
        {"name":"Tan, Raymond","id":"694409","comeDay":"","address":"","amTime":""},
        {"name":"Tang, Alice","id":"694410","comeDay":"","address":"","amTime":""},
        {"name":"Tang, Kok Fang","id":"490311","comeDay":"1","address":"185519","amTime":""},
        {"name":"Tang, Nien","id":"490310","comeDay":"","address":"","amTime":""},
        {"name":"Taussig, Marie","id":"173333","comeDay":"","address":"","amTime":""},
        {"name":"Tavakoli Malek, Zahra","id":"PC8546","comeDay":"","address":"","amTime":""},
        {"name":"Taylor, Peggy","id":"694416","comeDay":"","address":"","amTime":""},
        {"name":"The, Siang Hoei","id":"PC8547","comeDay":"3","address":"","amTime":""},
        {"name":"Tieu, Minh","id":"694428","comeDay":"12345","address":"","amTime":""},
        {"name":"Todd, Terrance","id":"PC8548","comeDay":"","address":"","amTime":""},
        {"name":"Tong, Kam Siu","id":"PC8549","comeDay":"","address":"","amTime":""},
        {"name":"Tran, Anh ","id":"PC8453","comeDay":"135","address":"","amTime":""},
        {"name":"Tran, Hong","id":"PC8550","comeDay":"1","address":"","amTime":""},
        {"name":"Tran, Phouc","id":"PC8551","comeDay":"","address":"","amTime":""},
        {"name":"Tu, David","id":"490307","comeDay":"1","address":"","amTime":""},
        {"name":"Umeukeje, Alice","id":"635789","comeDay":"15","address":"","amTime":""},
        {"name":"Umeukeje, Timothy","id":"PC8552","comeDay":"15","address":"","amTime":""},
        {"name":"Vaccari, Vivian","id":"694444","comeDay":"","address":"","amTime":""},
        {"name":"Vasquez, Leticia","id":"663298","comeDay":"14","address":"","amTime":""},
        {"name":"Vass, Tatiana","id":"173339","comeDay":"","address":"","amTime":""},
        {"name":"Wan, Lai Yin","id":"490300","comeDay":"","address":"","amTime":""},
        {"name":"Wang, Caishao","id":"PC8553","comeDay":"","address":"","amTime":""},
        {"name":"Wang, Chun Ling","id":"490299","comeDay":"","address":"","amTime":""},
        {"name":"Wang, Dao Gang","id":"195604","comeDay":"","address":"","amTime":""},
        {"name":"Wang, Judy","id":"694478","comeDay":"","address":"","amTime":""},
        {"name":"Wang, You Lan","id":"694480","comeDay":"","address":"","amTime":""},
        {"name":"Washington, Betty","id":"694487","comeDay":"","address":"","amTime":""},
        {"name":"Webster, Sr. Margaret","id":"PC8554","comeDay":"","address":"","amTime":""},
        {"name":"Williams, Michael","id":"694511","comeDay":"","address":"","amTime":""},
        {"name":"Wilson, Cregg","id":"PC8479","comeDay":"","address":"","amTime":""},
        {"name":"Wilton, Donald","id":"PC13708","comeDay":"4","address":"","amTime":""},
        {"name":"Wong, Bill Kwok","id":"PC8555","comeDay":"134","address":"","amTime":""},
        {"name":"Wong, Fung Ying","id":"694519","comeDay":"15","address":"","amTime":""},
        {"name":"Wong, Gam Fee ","id":"PC8456","comeDay":"12345","address":"","amTime":""},
        {"name":"Wong, Henry","id":"PC14144","comeDay":"13","address":"","amTime":""},
        {"name":"Wong, Iris","id":"694520","comeDay":"5","address":"","amTime":""},
        {"name":"Wong, John","id":"694521","comeDay":"","address":"","amTime":""},
        {"name":"Wong, Kam Sau","id":"645710","comeDay":"","address":"","amTime":""},
        {"name":"Wong, May Oi ","id":"694522","comeDay":"3","address":"","amTime":""},
        {"name":"Wong, Po Kun","id":"490289","comeDay":"","address":"","amTime":""},
        {"name":"Wong, Shou Chu","id":"648560","comeDay":"1234","address":"","amTime":""},
        {"name":"Wong, Wai C","id":"PC8556","comeDay":"","address":"","amTime":""},
        {"name":"Woo, May","id":"195073","comeDay":"","address":"","amTime":""},
        {"name":"Woo, Mu Jie X","id":"PC8557","comeDay":"25","address":"","amTime":""},
        {"name":"Woodard, Larry","id":"173341","comeDay":"","address":"","amTime":""},
        {"name":"Woods, Renita","id":"694528","comeDay":"","address":"","amTime":""},
        {"name":"Wu, Gan","id":"694532","comeDay":"4","address":"","amTime":"10:45"},
        {"name":"Xu, Anne","id":"490281","comeDay":"","address":"","amTime":""},
        {"name":"Xu, Gen Su","id":"694535","comeDay":"","address":"","amTime":""},
        {"name":"Xu, ZiYin","id":"694537","comeDay":"","address":"","amTime":""},
        {"name":"Yadambat, Baatar","id":"694538","comeDay":"","address":"","amTime":""},
        {"name":"Yancey, Norbert","id":"694540","comeDay":"35","address":"","amTime":""},
        {"name":"Yang, Feng Lan","id":"PC9634","comeDay":"","address":"","amTime":""},
        {"name":"Ye, Wei Hua","id":"694546","comeDay":"","address":"","amTime":""},
        {"name":"Ye, Yi Bin","id":"694547","comeDay":"","address":"","amTime":""},
        {"name":"Yearwood, Eloisa","id":"PC13918","comeDay":"","address":"","amTime":""},
        {"name":"Yeoh, Khian Heng ","id":"PC8558","comeDay":"","address":"","amTime":""},
        {"name":"Yeung, LinYing","id":"534369","comeDay":"","address":"","amTime":""},
        {"name":"Yim, Wai Hing","id":"694549","comeDay":"","address":"","amTime":""},
        {"name":"Yin, Shan","id":"PC15863","comeDay":"","address":"","amTime":""},
        {"name":"Yu, Birui","id":"694550","comeDay":"4","address":"","amTime":"10:45"},
        {"name":"Yu, Hua Sheng","id":"PC12413","comeDay":"","address":"","amTime":""},
        {"name":"Yu, Kwai Ha","id":"694552","comeDay":"","address":"","amTime":""},
        {"name":"Yu, Thomas","id":"195228","comeDay":"245","address":"","amTime":""},
        {"name":"Yuan, Fu","id":"PC8561","comeDay":"35","address":"","amTime":""},
        {"name":"Yuan, Shun","id":"694555","comeDay":"5","address":"","amTime":""},
        {"name":"Yunden, Tsogtchimeg","id":"694557","comeDay":"","address":"","amTime":""},
        {"name":"Zalkus, David","id":"490271","comeDay":"","address":"","amTime":""},
        {"name":"Zavaleta, Dora","id":"694563","comeDay":"","address":"","amTime":""},
        {"name":"Zeng, HanYing","id":"694564","comeDay":"","address":"","amTime":""},
        {"name":"Zhang Jin Quan","id":"PC10471","comeDay":"","address":"","amTime":""},
        {"name":"Zhang, De Zhen","id":"694565","comeDay":"5","address":"","amTime":""},
        {"name":"Zhang, Kuiying","id":"494956","comeDay":"12345","address":"","amTime":""},
        {"name":"Zhou, Xing H","id":"PC8562","comeDay":"","address":"","amTime":""},
        {"name":"Zhu, Cui Liang ","id":"694569","comeDay":"","address":"","amTime":""},
        {"name":"Zuckman, Jon","id":"185592","comeDay":"","address":"","amTime":""}
    ];
    let attx=[];


    //add the attendance days button function

    $(".footer:first").html($(".footer:first").html()+`<button id='day1' class='attxDay'>Monday</button>
<button id='day2' class='attxDay'>Tuesday</button>
<button id='day3' class='attxDay'>Wednesday</button>
<button id='day4' class='attxDay'>Thursday</button>
<button id='day5' class='attxDay'>Friday</button>`)

    $(".footer:first").html($(".footer:first").html()+`<table style="width:100%;font-size:20px;background:#4E2236;color:#4E2236" id="dar_table"><table>`);
    let tableInner=`
    <tr style="color:#F26363">
    <th style="width:3%"><input type="checkbox" name="prts" id="check_all" style="zoom:200%"></th>
    <th style="width:7%">Prt ID</th>
    <th style="width:15%">Prt Name</th>
	<th style="width:12%">A Leg location</th>
    <th style="width:12%">B leg Location</th>
    <th style="width:12%">Begin Time</th>
    <th style="width:12%">End Time</th>
    <th style="width:10%">Appt Type</th>
    <th style="width:15%">Notes</th>
  </tr>`;

//fill the prt to the table
    for(let prt of prts){
        let temp="<tr class='each_prt' style='background:#E997A7;border-bottom:1px solid #000000'>";
        temp+=`<td><input type="checkbox" class="prtBox" name="prts" id="${prt.id}" style="zoom:200%"></td>`;
        temp+=`<td>${prt.id}</td>`;
        temp+=`<td>${prt.name}</td>`;
        temp+=`<td><input style='background-color:transparent' type="text" id="${prt.id}_A_leg_id" value="${prt.address?prt.address:prt.id}"></td>`;
        temp+=`<td><input style='background-color:transparent' type="text" id="${prt.id}_B_leg_id" value="490078"><br></td>`;
        temp+=`<td><input style='background-color:transparent' type="text" id="${prt.id}_Begin_Time" value="${prt.amTime?prt.amTime:'10:00'}"></td>`;
        temp+=`<td><input style='background-color:transparent' type="text" id="${prt.id}_End_Time" value="15:30"></td>`;
        temp+=`<td><input style='background-color:transparent' type="text" id="${prt.id}_appt_type" value="Center Attendance"></td>`;
        temp+=`<td><input style='background-color:transparent' type="text" id="${prt.id}_note" value="${prt.note?prt.note:''}"></td>`;

        temp+="</tr>";
        tableInner+=temp;
    }
    tableInner+=`<tr><td colspan="8"><button id="submit">submit</button></td></tr>`;


    $("#dar_table").html(tableInner);


    $(".prtBox").click(function(e){
//
//        let prtId=this.id;
//        let tempALeg=[
//            /*prtId*/				prtId,
//            /*pickUpTime*/			"",
//            /*dropOffTime*/			$(`#${prtId}_Begin_Time`).val(),
//           /*aLegLocId*/			$(`#${prtId}_A_leg_id`).val(),
//            /*bLegLocId*/			$(`#${prtId}_B_leg_id`).val(),
//            /*appt_type*/			$(`#${prtId}_appt_type`).val(),
//            /*note*/				$(`#${prtId}_note`).val()
//        ];
//        let tempBLeg=[
//            /*prtId*/				prtId,
//            /*pickUpTime*/			$(`#${prtId}_End_Time`).val(),
//            /*dropOffTime*/			"",
//            /*aLegLocId*/			$(`#${prtId}_B_leg_id`).val(),
//            /*bLegLocId*/			$(`#${prtId}_A_leg_id`).val(),
//           /*appt_type*/			$(`#${prtId}_appt_type`).val(),
//            /*note*/				$(`#${prtId}_note`).val()
//        ];
//        let temp=tempALeg.join('\t')+"\n"+tempBLeg.join('\t')

        let temp = buildPrtList(this.id)

        if($(this).is(":checked")){
            //temp+=(prt.id+'\n')
            attx.push(temp);
        }else{
            attx=attx.filter(p=>p!=temp)
        }
        //alert(attxList)
        $("#pasteArea").val(attx.join("\n"));

    })

    //add the listener to the button
    $(".attxDay").click(function(e){
        let day=this.id.replace("day","")
        attx=[];
        for(let prt of prts){
            let temp = buildPrtList(prt.id)
            if(prt.comeDay.indexOf(day)>0 && !$("#"+prt.id).is(":checked")){
                $("#"+prt.id).prop("checked",true)
                attx.push(temp);
                //console.log(attx);
            }else{
                $("#"+prt.id).prop("checked",false);
                attx=attx.filter(p=>p!=temp)
            }
        }

        $("#pasteArea").val(attx.join("\n"));
    })

//Mouseover high light the prt
    $(".each_prt").mouseover(function(){
        $(this).css("background-color","#F26363");

    }).mouseout(function(){
        $(this).css("background-color","#E997A7");
    })

    // Function

    function buildPrtList(prtId){
        let tempALeg=[
            /*prtId*/				prtId,
            /*pickUpTime*/			"",
            /*dropOffTime*/			$(`#${prtId}_Begin_Time`).val(),
            /*aLegLocId*/			$(`#${prtId}_A_leg_id`).val(),
            /*bLegLocId*/			$(`#${prtId}_B_leg_id`).val(),
            /*appt_type*/			$(`#${prtId}_appt_type`).val(),
            /*note*/				$(`#${prtId}_note`).val()
        ];
        let tempBLeg=[
            /*prtId*/				prtId,
            /*pickUpTime*/			$(`#${prtId}_End_Time`).val(),
            /*dropOffTime*/			"",
            /*aLegLocId*/			$(`#${prtId}_B_leg_id`).val(),
            /*bLegLocId*/			$(`#${prtId}_A_leg_id`).val(),
            /*appt_type*/			$(`#${prtId}_appt_type`).val(),
            /*note*/				$(`#${prtId}_note`).val()
        ];


        return tempALeg.join('\t')+"\n"+tempBLeg.join('\t')
    }
});