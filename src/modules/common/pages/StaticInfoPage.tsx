import { Card, Typography } from 'antd'
import './StaticInfoPage.css'

type StaticInfoPageProps = {
  title: string
}

export default function StaticInfoPage({ title }: StaticInfoPageProps) {
  return (
    <main className="static-info-page">
      <Card>
        <Typography.Title level={1}>{title}</Typography.Title>

        <section className="static-info-content">
          <Typography.Paragraph>
            Chào mừng quý khách đến mua sắm tại SE Book. Sau khi truy cập vào website SE Book
            để tham khảo hoặc mua sắm, quý khách đã đồng ý tuân thủ và ràng buộc với những quy
            định của SE Book. Vui lòng xem kỹ các quy định và hợp tác với chúng tôi để xây dựng
            một website SE Book ngày càng thân thiện và phục vụ tốt những yêu cầu của chính quý
            khách. Ngoài ra, nếu có bất cứ câu hỏi nào về những thỏa thuận dưới đây, vui lòng liên
            hệ với SE Book theo số điện thoại hotline 1900636467 hoặc email cho chúng tôi qua địa
            chỉ cskh@sebook.vn.
          </Typography.Paragraph>

          <Typography.Title level={3}>Tài khoản của khách hàng</Typography.Title>
          <Typography.Paragraph>
            Một số dịch vụ, tính năng tại đây yêu cầu quý khách cần phải đăng ký Tài khoản SE Book
            thì mới có thể sử dụng. Do đó, để tận hưởng đầy đủ các dịch vụ và tính năng này, quý
            khách vui lòng cho phép SE Book tiến hành xử lý các dữ liệu cá nhân cơ bản sau:
          </Typography.Paragraph>
          <ul>
            <li>
              <strong>Dữ liệu cá nhân cơ bản bắt buộc phải cung cấp</strong>, là các thông tin giúp
              xác định danh tính đối với từng tài khoản SE Book, bao gồm họ tên, địa chỉ email, số
              điện thoại,... của quý khách.
            </li>
            <li>
              <strong>Dữ liệu cá nhân cơ bản được cung cấp để phục vụ giao dịch</strong>, là các
              thông tin cần thiết để thực hiện một giao dịch tại website sebook.vn, bao gồm địa chỉ
              giao hàng, địa chỉ thanh toán, phương thức thanh toán,... của quý khách.
            </li>
            <li>
              <strong>Dữ liệu cá nhân cơ bản tự nguyện cung cấp</strong>, là các thông tin mà quý
              khách có thể chia sẻ hoặc không để cá nhân hóa trải nghiệm sử dụng dịch vụ tại SE
              Book, bao gồm ngày tháng năm sinh, giới tính, sở thích, nghề nghiệp,... của quý khách.
            </li>
          </ul>
          <Typography.Paragraph>
            Trường hợp quý khách đăng ký tài khoản SE Book thông qua tài khoản Facebook hoặc
            Google, các dữ liệu cá nhân cơ bản của quý khách cung cấp cho các nền tảng này như họ
            tên, địa chỉ email, số điện thoại, ảnh đại diện,... sẽ được gửi đến SE Book ngay khi quý
            khách cho phép SE Book truy cập vào thông tin của quý khách trên các nền tảng này theo
            từng chính sách của nền tảng.
          </Typography.Paragraph>
          <Typography.Paragraph>
            Việc sử dụng và bảo mật thông tin Tài khoản SE Book là trách nhiệm và quyền lợi của quý
            khách khi sử dụng dịch vụ tại SE Book. Quý khách phải giữ kín mật khẩu và tài khoản,
            hoàn toàn chịu trách nhiệm đối với tất cả các hoạt động diễn ra thông qua việc sử dụng
            mật khẩu hoặc tài khoản của mình. Quý khách nên đảm bảo thoát khỏi Tài khoản SE Book sau
            mỗi lần sử dụng để bảo mật dữ liệu cá nhân của mình.
          </Typography.Paragraph>
          <Typography.Paragraph>
            Trong trường hợp thông tin do quý khách cung cấp không đầy đủ hoặc có sai sót dẫn đến
            việc không thể giao hàng cho quý khách, chúng tôi có quyền đình chỉ hoặc từ chối phục
            vụ, giao hàng mà không phải chịu bất cứ trách nhiệm nào đối với quý khách. Khi có những
            thay đổi thông tin của quý khách, vui lòng cập nhật lại thông tin trong Tài khoản SE
            Book.
          </Typography.Paragraph>
          <Typography.Paragraph>
            SE Book không cho phép việc sử dụng các loại phần mềm giả lập, phần mềm mô phỏng, phần
            mềm thực hiện tác vụ tự động, hoặc bất kỳ các loại phần mềm có bản chất tương tự khác để
            truy cập Web/App SE Book. Việc sử dụng những phần mềm này là hành động vi phạm các điều
            khoản của SE Book.
          </Typography.Paragraph>
          <Typography.Paragraph>
            Bất kỳ hành động truy cập SE Book thông qua các loại phần mềm, thiết bị bên thứ ba không
            được cấp phép hoặc thông qua những phiên bản SE Book không chính thức, nếu bị phát hiện,
            đều sẽ dẫn tới việc tài khoản SE Book của bạn bị tạm thời hạn chế một số tính năng nhất
            định, hoặc nghiêm trọng hơn là bị khóa vĩnh viễn.
          </Typography.Paragraph>

          <Typography.Title level={3}>Lưu ý</Typography.Title>
          <Typography.Paragraph>
            Trong trường hợp bạn vô tình hoặc bị một cá nhân khác truy cập vào SE Book thông qua các
            phương thức không được cho phép dẫn đến tài khoản SE Book của bạn bị hạn chế hoặc bị
            khóa, vui lòng liên hệ Bộ phận CSKH SE Book để được hỗ trợ.
          </Typography.Paragraph>
          <Typography.Paragraph>
            Để xác thực tài khoản hoặc lấy lại mật khẩu, quý khách vui lòng sử dụng chức năng Quên
            Mật Khẩu và thực hiện xác minh chính chủ qua Số Điện Thoại hoặc Email đã đăng ký. SE
            Book không hỗ trợ khôi phục mật khẩu nếu không xác minh được chính chủ tài khoản qua các
            thông tin này.
          </Typography.Paragraph>

          <Typography.Title level={3}>Quyền lợi bảo mật dữ liệu cá nhân của khách hàng</Typography.Title>
          <Typography.Paragraph>
            Khi sử dụng dịch vụ tại website SE Book, quý khách được đảm bảo rằng những thông tin
            cung cấp cho chúng tôi sẽ chỉ được dùng để nâng cao chất lượng dịch vụ dành cho khách
            hàng của SE Book và sẽ không được chuyển giao cho một bên thứ ba nào khác vì mục đích
            thương mại.
          </Typography.Paragraph>
          <Typography.Paragraph>
            Trường hợp quý khách có yêu cầu rút lại sự đồng ý, xóa, chỉnh sửa, phản đối, yêu cầu
            cung cấp, yêu cầu hạn chế xử lý đối với các dữ liệu cá nhân của mình, quý khách vui lòng
            thao tác trên hệ thống website hoặc liên hệ với SE Book theo số điện thoại hotline
            1900636467 hoặc email cskh@sebook.vn.
          </Typography.Paragraph>
          <Typography.Paragraph>
            Dữ liệu cá nhân của quý khách tại SE Book sẽ được chúng tôi bảo mật và chỉ trong trường
            hợp pháp luật yêu cầu, chúng tôi sẽ buộc phải cung cấp những thông tin này cho các cơ
            quan có thẩm quyền.
          </Typography.Paragraph>

          <Typography.Title level={3}>Trách nhiệm của khách hàng khi sử dụng dịch vụ của SE Book</Typography.Title>
          <Typography.Paragraph>
            Quý khách tuyệt đối không được sử dụng bất kỳ công cụ, phương pháp nào để can thiệp, xâm
            nhập bất hợp pháp vào hệ thống hay làm thay đổi cấu trúc dữ liệu tại website SE Book.
            Quý khách không được có những hành động như thực hiện, cổ vũ việc can thiệp, xâm nhập dữ
            liệu của SE Book cũng như hệ thống máy chủ của chúng tôi.
          </Typography.Paragraph>
          <Typography.Paragraph>
            Quý khách không được đưa ra những nhận xét, đánh giá có ý xúc phạm, quấy rối, làm phiền
            hoặc có bất cứ hành vi nào thiếu văn hóa đối với người khác. Không nêu ra những nhận xét
            có tính chính trị, kỳ thị tôn giáo, giới tính, sắc tộc. Tuyệt đối cấm mọi hành vi mạo
            nhận, cố ý tạo sự nhầm lẫn mình là một khách hàng khác hoặc là thành viên Ban Quản Trị
            SE Book.
          </Typography.Paragraph>

          <Typography.Title level={3}>Trách nhiệm và quyền lợi của SE Book</Typography.Title>
          <Typography.Paragraph>
            <strong>Trách nhiệm của SE Book:</strong> Chúng tôi chịu trách nhiệm tuân thủ các nguyên
            tắc về xử lý dữ liệu cá nhân theo đúng quy định pháp luật và các điều khoản được nêu ra
            tại chính sách bảo mật dữ liệu cá nhân của khách hàng. Trong trường hợp có những phát
            sinh ngoài ý muốn hoặc trách nhiệm của mình, SE Book sẽ không chịu trách nhiệm về mọi
            tổn thất phát sinh.
          </Typography.Paragraph>
          <Typography.Paragraph>
            <strong>Quyền lợi của SE Book:</strong> Chúng tôi không cho phép bất kỳ tổ chức, cá nhân
            nào quảng bá sản phẩm tại website SE Book mà chưa có sự đồng ý bằng văn bản từ SE Book.
            Các thỏa thuận và quy định trong điều khoản sử dụng này có thể thay đổi vào bất cứ lúc
            nào nhưng sẽ được SE Book thông báo cụ thể trên website SE Book.
          </Typography.Paragraph>
          <Typography.Paragraph>
            Trong các chương trình do SE Book triển khai trên App/Web, trường hợp SE Book xác định
            quý khách có hành vi gian lận, can thiệp trái phép vào hệ thống, hoặc vi phạm bất kỳ quy
            định nào của chương trình, SE Book có toàn quyền thu hồi một phần hoặc toàn bộ phần
            thưởng của quý khách, đồng thời không có nghĩa vụ thông báo trước hay chịu bất kỳ trách
            nhiệm nào phát sinh liên quan.
          </Typography.Paragraph>
          <Typography.Paragraph>
            SE Book bảo lưu quyền từ chối xử lý, hủy bỏ hoặc giới hạn số lượng bất kỳ đơn hàng nào
            được xác định có dấu hiệu hoặc bằng chứng về hành vi đầu cơ, tích trữ thương mại, hoặc
            mua hàng không nhằm mục đích tiêu dùng cá nhân theo đánh giá và xác minh nội bộ của
            chúng tôi. Quyết định này là cuối cùng và nhằm mục đích đảm bảo nguồn cung và sự công
            bằng cho tất cả khách hàng.
          </Typography.Paragraph>
          <Typography.Paragraph>
            Ngoài ra, xin vui lòng thông báo cho quản trị web của SE Book ngay khi quý khách phát
            hiện ra lỗi hệ thống theo số điện thoại hotline 1900636467 hoặc email cskh@sebook.vn.
          </Typography.Paragraph>

          <Typography.Paragraph className="static-info-agreement">
            TÔI ĐÃ ĐỌC CÁC ĐIỀU KHOẢN DỊCH VỤ NÀY VÀ ĐỒNG Ý VỚI TẤT CẢ CÁC ĐIỀU KHOẢN NHƯ TRÊN
            CŨNG NHƯ BẤT KỲ ĐIỀU KHOẢN NÀO ĐƯỢC CHỈNH SỬA SAU NÀY. BẰNG CÁCH BẤM NÚT "ĐĂNG KÝ" KHI
            ĐĂNG KÝ SỬ DỤNG TRANG SE BOOK, TÔI HIỂU RẰNG TÔI ĐANG TẠO CHỮ KÝ ĐIỆN TỬ MÀ TÔI HIỂU
            RẰNG NÓ CÓ GIÁ TRỊ VÀ HIỆU LỰC TƯƠNG TỰ NHƯ CHỮ KÝ TÔI KÝ BẰNG TAY.
          </Typography.Paragraph>

          <Typography.Title level={3}>Hiệu lực</Typography.Title>
          <Typography.Paragraph>
            Điều khoản sử dụng dịch vụ này được cập nhật và có hiệu lực từ ngày 01/06/2024. SE Book
            có thể điều chỉnh điều khoản sử dụng dịch vụ này vào bất kỳ thời điểm nào, và đăng tải
            công khai điều khoản sử dụng đã được điều chỉnh trên website sebook.vn. Việc khách hàng
            tiếp tục sử dụng dịch vụ của SE Book mà không có bất kỳ khiếu nại nào đối với chính sách
            được điều chỉnh sẽ được hiểu rằng khách hàng đã chấp thuận điều khoản sử dụng dịch vụ
            được điều chỉnh đó của SE Book.
          </Typography.Paragraph>

          <Typography.Paragraph className="static-info-signature">
            ĐẠI DIỆN SE BOOK
            <br />
            <br />
            [Đã ký và đóng dấu]
            <br />
            <br />
            NHÓM 02 KTVTKPM DHKTPM18A
          </Typography.Paragraph>
        </section>
      </Card>
    </main>
  )
}
